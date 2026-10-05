// 9Router API Client with Multi-Key Rotation & Combo Support

export const normalizeBaseUrl = (url) => {
  if (!url) return 'http://localhost:20128/v1';
  let cleaned = url.trim().replace(/\/+$/, '');
  // If user enters http://localhost:20128 without /v1, add /v1 if needed
  if (!cleaned.endsWith('/v1')) {
    cleaned += '/v1';
  }
  return cleaned;
};

// Fetch available models using a given API key
export const fetchModelsFromKey = async (baseUrl, apiKey) => {
  const url = `${normalizeBaseUrl(baseUrl)}/models`;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const rawList = Array.isArray(data) ? data : data.data || [];

  // Universal provider label formatter
  const formatProviderLabel = (p) => {
    if (!p) return 'Other';
    const map = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      gemini: 'Gemini',
      deepseek: 'DeepSeek',
      meta: 'Meta',
      ollama: 'Ollama',
      openrouter: 'OpenRouter',
      mistral: 'Mistral',
      groq: 'Groq',
      mimo: 'Mimo',
      qwen: 'Qwen',
    };
    return map[p.toLowerCase()] || (p.charAt(0).toUpperCase() + p.slice(1));
  };

  // Parse and categorize models dynamically
  return rawList.map((m) => {
    const id = typeof m === 'string' ? m : m.id;
    const name = m.name || id;
    const ownedBy = (m.owned_by || '').toLowerCase();
    const lower = id.toLowerCase();

    // Determine if it is a combo model
    const isCombo = 
      ownedBy === 'combo' || 
      lower.includes('combo') || 
      lower.startsWith('combo:') ||
      lower.startsWith('combo/');
    
    // Extract provider dynamically
    let provider = 'other';
    if (isCombo) {
      provider = 'combo';
    } else if (id.includes('/')) {
      provider = id.split('/')[0].toLowerCase();
    } else if (ownedBy && ownedBy !== 'openai' && ownedBy !== '9router') {
      provider = ownedBy;
    } else {
      if (lower.includes('gpt') || lower.includes('o1') || lower.includes('o3') || lower.includes('openai')) provider = 'openai';
      else if (lower.includes('claude') || lower.includes('anthropic')) provider = 'anthropic';
      else if (lower.includes('gemini') || lower.includes('google')) provider = 'google';
      else if (lower.includes('deepseek')) provider = 'deepseek';
      else if (lower.includes('llama') || lower.includes('meta')) provider = 'meta';
      else if (lower.includes('mistral') || lower.includes('codestral')) provider = 'mistral';
      else if (lower.includes('qwen')) provider = 'qwen';
      else if (ownedBy) provider = ownedBy;
    }

    return {
      id,
      name,
      provider,
      isCombo,
      ownedBy: m.owned_by || (isCombo ? 'combo' : provider),
      contextLength: m.context_length || m.capabilities?.contextWindow || null,
      description: m.description || (isCombo ? 'Virtual Combo Model' : `${formatProviderLabel(provider)} Model`),
    };
  });
};

// Fetch and merge models across all provided keys
export const fetchAllModels = async (baseUrl, keys) => {
  if (!keys || keys.length === 0) {
    // Try without auth in case 9router local proxy doesn't require key for /models
    try {
      return await fetchModelsFromKey(baseUrl, '');
    } catch {
      return [];
    }
  }

  const modelMap = new Map();
  const errors = [];

  for (const keyObj of keys) {
    if (!keyObj.key) continue;
    try {
      const list = await fetchModelsFromKey(baseUrl, keyObj.key);
      list.forEach((model) => {
        if (!modelMap.has(model.id)) {
          modelMap.set(model.id, {
            ...model,
            availableInKeys: [keyObj.id || keyObj.name],
          });
        } else {
          const existing = modelMap.get(model.id);
          if (!existing.availableInKeys.includes(keyObj.id || keyObj.name)) {
            existing.availableInKeys.push(keyObj.id || keyObj.name);
          }
        }
      });
    } catch (err) {
      errors.push({ keyName: keyObj.name, error: err.message });
    }
  }

  if (modelMap.size === 0 && errors.length > 0) {
    throw new Error(`Model fetch failed: ${errors[0].keyName}: ${errors[0].error}`);
  }

  return Array.from(modelMap.values());
};

// Execute chat completion with Key Rotation & Failover
export const sendChatCompletion = async ({
  baseUrl,
  keys,
  rotationMode = 'failover',
  activeKeyId = null,
  model,
  messages,
  temperature = 0.7,
  maxTokens = 4096,
  topP = 1,
  stream = true,
  signal,
  onChunk,
  onKeyUsed,
}) => {
  const url = `${normalizeBaseUrl(baseUrl)}/chat/completions`;

  // Prepare ordered list of candidate keys
  let candidateKeys = [...keys.filter((k) => k.key && k.key.trim() !== '')];
  
  if (candidateKeys.length === 0) {
    // Attempt request with empty key if local proxy runs open
    candidateKeys = [{ id: 'local-default', name: 'Local Proxy (No Auth)', key: '' }];
  } else if (rotationMode === 'manual' && activeKeyId) {
    const selected = candidateKeys.find((k) => k.id === activeKeyId);
    candidateKeys = selected ? [selected] : candidateKeys;
  } else if (rotationMode === 'failover' && activeKeyId) {
    const activeIndex = candidateKeys.findIndex((k) => k.id === activeKeyId);
    if (activeIndex > 0) {
      const [active] = candidateKeys.splice(activeIndex, 1);
      candidateKeys.unshift(active);
    }
  } else if (rotationMode === 'round-robin') {
    // Key rotation handled by caller or random shuffle / next index
    const seed = Math.floor(Math.random() * candidateKeys.length);
    candidateKeys = [...candidateKeys.slice(seed), ...candidateKeys.slice(0, seed)];
  }

  let lastError = null;

  for (let i = 0; i < candidateKeys.length; i++) {
    const currentKey = candidateKeys[i];
    if (onKeyUsed) {
      onKeyUsed(currentKey, i, candidateKeys.length);
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    if (currentKey.key) {
      headers['Authorization'] = `Bearer ${currentKey.key.trim()}`;
    }

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const errObj = new Error(
          `Key "${currentKey.name}" HTTP ${response.status}: ${errorBody || response.statusText}`
        );
        errObj.status = response.status;
        errObj.keyId = currentKey.id;

        // If rate limit (429) or overload (503/500/502/401/403) and we have more keys, try next key!
        if (
          candidateKeys.length > 1 &&
          (response.status === 429 || response.status === 401 || response.status === 402 || response.status >= 500)
        ) {
          console.warn(`[9Router Failover] Key "${currentKey.name}" failed with ${response.status}. Trying next key...`);
          lastError = errObj;
          continue; // Try next key
        } else {
          throw errObj;
        }
      }

      // If streaming response
      if (stream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let fullReasoning = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            if (jsonStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta) {
                if (delta.content) {
                  fullText += delta.content;
                }
                if (delta.reasoning_content) {
                  fullReasoning += delta.reasoning_content;
                }
                if (onChunk) {
                  onChunk({
                    content: fullText,
                    delta: delta.content || '',
                    reasoning: fullReasoning,
                    keyUsed: currentKey,
                  });
                }
              }
            } catch (err) {
              // Ignore line parse errors during SSE stream
            }
          }
        }

        return {
          content: fullText,
          reasoning: fullReasoning,
          keyUsed: currentKey,
        };
      } else {
        // Non-streaming JSON response
        const data = await response.json();
        const choice = data.choices?.[0]?.message;
        const content = choice?.content || '';
        const reasoning = choice?.reasoning_content || '';

        if (onChunk) {
          onChunk({
            content,
            delta: content,
            reasoning,
            keyUsed: currentKey,
          });
        }

        return {
          content,
          reasoning,
          keyUsed: currentKey,
        };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }
      lastError = err;
      if (candidateKeys.length > 1 && i < candidateKeys.length - 1) {
        console.warn(`[9Router Failover] Network error on key "${currentKey.name}". Trying next key...`, err);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All configured 9Router keys failed.');
};
