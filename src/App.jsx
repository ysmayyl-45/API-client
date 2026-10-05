import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import KeyManagerModal from './components/KeyManagerModal';
import ModelSelectorModal, { DEFAULT_PRESET_MODELS } from './components/ModelSelectorModal';
import SettingsModal from './components/SettingsModal';
import { 
  getStoredSettings, 
  saveStoredSettings, 
  getStoredKeys, 
  saveStoredKeys, 
  getStoredChats, 
  saveStoredChats, 
  getStoredActiveChatId, 
  saveStoredActiveChatId,
  getStoredModelsCache,
  saveStoredModelsCache
} from './utils/storage';
import { sendChatCompletion, fetchAllModels } from './services/api';
import { 
  Menu, 
  ChevronDown, 
  Download,
  Settings2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState(getStoredSettings);
  const [keys, setKeys] = useState(getStoredKeys);
  const [chats, setChats] = useState(getStoredChats);
  const [activeChatId, setActiveChatId] = useState(getStoredActiveChatId);
  const [models, setModels] = useState(() => {
    const cached = getStoredModelsCache();
    return cached.length > 0 ? cached : DEFAULT_PRESET_MODELS;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [notification, setNotification] = useState(null);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Sync state to LocalStorage
  useEffect(() => { saveStoredSettings(settings); }, [settings]);
  useEffect(() => { saveStoredKeys(keys); }, [keys]);
  useEffect(() => { saveStoredChats(chats); }, [chats]);
  useEffect(() => { saveStoredActiveChatId(activeChatId); }, [activeChatId]);
  useEffect(() => { saveStoredModelsCache(models); }, [models]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeKeyObj = keys.find((k) => k.id === settings.activeKeyId) || keys[0] || null;

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeChatId]);

  useEffect(() => {
    if (isLoading) scrollToBottom('smooth');
  }, [activeChat?.messages]);

  const handleNewChat = () => {
    const newChat = {
      id: 'chat_' + Date.now(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  // Auto-sync models on mount from 9Router if available
  useEffect(() => {
    if (chats.length === 0) handleNewChat();
    else if (!activeChatId) setActiveChatId(chats[0].id);

    const autoSync = async () => {
      try {
        const activeKeys = keys.filter((k) => k.enabled);
        const list = await fetchAllModels(settings.baseUrl, activeKeys);
        if (list && list.length > 0) {
          setModels(list);
          const currentValid = list.some((m) => m.id === settings.selectedModel);
          // If no model selected or current model is not found in gateway models, pick the first available
          if (!settings.selectedModel || !currentValid) {
            setSettings((s) => ({ ...s, selectedModel: list[0].id }));
          }
        }
      } catch (e) {
        // Offline or proxy not reachable
      }
    };
    autoSync();
  }, []);

  const handleDeleteChat = (id) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    if (activeChatId === id) setActiveChatId(updated[0]?.id || null);
  };

  const handleRenameChat = (id, newTitle) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleRefreshModels = async () => {
    setIsRefreshingModels(true);
    try {
      const activeKeys = keys.filter((k) => k.enabled);
      const list = await fetchAllModels(settings.baseUrl, activeKeys);
      if (list && list.length > 0) {
        setModels(list);
        setNotification({ type: 'success', text: `Updated ${list.length} models from 9Router.` });
      }
    } catch (err) {
      setNotification({ type: 'error', text: `Sync error: ${err.message}` });
    } finally {
      setIsRefreshingModels(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSend = async (customPrompt = null, forceModel = null) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isLoading) return;

    const modelToUse = forceModel || settings.selectedModel;
    let targetChatId = activeChatId;
    let currentChat = activeChat;

    if (!currentChat) {
      const newChat = {
        id: 'chat_' + Date.now(),
        title: promptToSend.trim().substring(0, 28) + '...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setChats([newChat, ...chats]);
      targetChatId = newChat.id;
      currentChat = newChat;
      setActiveChatId(newChat.id);
    }

    const userMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: promptToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const isFirst = currentChat.messages.length === 0;
    const chatTitle = isFirst
      ? promptToSend.trim().substring(0, 32) + (promptToSend.length > 32 ? '...' : '')
      : currentChat.title;

    const assistantPlaceholderId = 'msg_' + (Date.now() + 1);
    const assistantMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      reasoning: '',
      model: modelToUse,
      keyUsed: null,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentChat.messages, userMessage, assistantMessage];

    setChats((prev) =>
      prev.map((c) =>
        c.id === targetChatId
          ? { ...c, title: chatTitle, messages: updatedMessages, updatedAt: new Date().toISOString() }
          : c
      )
    );

    setInput('');
    setIsLoading(true);
    setNotification(null);

    const apiMessages = [];
    if (settings.systemPrompt && settings.systemPrompt.trim()) {
      apiMessages.push({ role: 'system', content: settings.systemPrompt.trim() });
    }
    [...currentChat.messages, userMessage].forEach((m) => {
      apiMessages.push({ role: m.role, content: m.content });
    });

    abortControllerRef.current = new AbortController();

    try {
      await sendChatCompletion({
        baseUrl: settings.baseUrl,
        keys: keys.filter((k) => k.enabled),
        rotationMode: settings.rotationMode,
        activeKeyId: settings.activeKeyId,
        model: modelToUse,
        messages: apiMessages,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        topP: settings.topP,
        stream: settings.stream,
        signal: abortControllerRef.current.signal,
        onChunk: ({ content, reasoning, keyUsed }) => {
          setChats((prev) =>
            prev.map((c) => {
              if (c.id !== targetChatId) return c;
              const msgs = c.messages.map((m) => {
                if (m.id === assistantPlaceholderId) {
                  return {
                    ...m,
                    content,
                    reasoning: reasoning || m.reasoning,
                    keyUsed: keyUsed || m.keyUsed,
                  };
                }
                return m;
              });
              return { ...c, messages: msgs };
            })
          );
        },
        onKeyUsed: (keyUsed, index, total, fallbackModel) => {
          if (fallbackModel) {
            setNotification({
              type: 'info',
              text: `Auto-recovery: Response generated via '${fallbackModel}'.`,
            });
          }
        },
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        // Cancelled by user
      } else {
        const isUnsupportedModel = err.message.includes('Unsupported model') || err.message.includes('400') || err.message.includes('model_not_found');
        let errorNotice = `⚠️ ${err.message}`;

        // Dynamically find an alternative model from loaded models
        const alternativeModel = models.find((m) => m.id !== modelToUse)?.id || null;

        if (isUnsupportedModel) {
          errorNotice = `⚠️ The model "${modelToUse}" is unavailable or not supported by your 9Router gateway. Please choose an active model from the top dropdown.`;
        }

        setChats((prev) =>
          prev.map((c) => {
            if (c.id !== targetChatId) return c;
            const msgs = c.messages.map((m) => {
              if (m.id === assistantPlaceholderId) {
                return {
                  ...m,
                  content: m.content ? `${m.content}\n\n${errorNotice}` : errorNotice,
                };
              }
              return m;
            });
            return { ...c, messages: msgs };
          })
        );

        setNotification({
          type: 'error',
          text: errorNotice,
          suggestedModel: alternativeModel,
          retryPrompt: promptToSend,
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (!activeChat || activeChat.messages.length < 2 || isLoading) return;
    const lastUserIdx = [...activeChat.messages].map((m, i) => ({ role: m.role, i })).reverse().find((m) => m.role === 'user');
    if (!lastUserIdx) return;
    const userPrompt = activeChat.messages[lastUserIdx.i].content;
    const pruned = activeChat.messages.slice(0, lastUserIdx.i);
    setChats((prev) => prev.map((c) => (c.id === activeChatId ? { ...c, messages: pruned } : c)));
    handleSend(userPrompt);
  };

  const handleClearAllChats = () => {
    if (window.confirm('Delete all conversation history?')) {
      setChats([]);
      setActiveChatId(null);
      handleNewChat();
      setIsSettingsModalOpen(false);
    }
  };

  const handleExportAllData = () => {
    const data = { version: '1.0', exportedAt: new Date().toISOString(), settings, keys, chats };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `9router_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.keys) setKeys(parsed.keys);
        if (parsed.chats) setChats(parsed.chats);
        alert('Backup restored successfully.');
        setIsSettingsModalOpen(false);
      } catch (err) {
        alert('Invalid backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportCurrentChat = () => {
    if (!activeChat || activeChat.messages.length === 0) return;
    let md = `# ${activeChat.title}\n\n---\n\n`;
    activeChat.messages.forEach((m) => {
      md += `### ${m.role === 'user' ? 'User' : m.model || 'Assistant'}\n\n${m.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        keysCount={keys.filter((k) => k.enabled).length}
      />

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-[#09090b]">
        {/* Minimalist Top Header */}
        <header className="h-13 border-b border-zinc-800/50 px-4 sm:px-6 flex items-center justify-between gap-3 bg-[#09090b]/80 backdrop-blur-md z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Model Selector Dropdown Trigger */}
            <button
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-zinc-800/60 text-zinc-200 transition font-medium text-xs tracking-tight"
            >
              <span>{settings.selectedModel || 'Select Model'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {activeChat && activeChat.messages.length > 0 && (
              <button
                onClick={handleExportCurrentChat}
                title="Export as Markdown"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              title="Settings"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Minimalist Notification Banner */}
        {notification && (
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/60 text-xs text-zinc-300 flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-3xl mx-auto w-full flex-wrap">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <span className="flex-1">{notification.text}</span>
              {notification.suggestedModel && (
                <button
                  type="button"
                  onClick={() => {
                    const m = notification.suggestedModel;
                    setSettings((s) => ({ ...s, selectedModel: m }));
                    setNotification(null);
                    if (notification.retryPrompt) {
                      handleSend(notification.retryPrompt, m);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-200 text-zinc-950 font-medium text-xs hover:bg-white transition"
                >
                  Switch to '{notification.suggestedModel}' & Retry
                </button>
              )}
            </div>
            <button onClick={() => setNotification(null)} className="text-zinc-500 hover:text-zinc-300 ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-2 pb-4">
          {!activeChat || activeChat.messages.length === 0 ? (
            /* Noble, Minimalist Welcome State */
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-3">
              <div className="text-xl font-medium tracking-tight text-zinc-200">
                9Router AI Studio
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
                Pure, seamless, and intelligent model experience.
              </p>
            </div>
          ) : (
            <div>
              {activeChat.messages.map((message, idx) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLast={idx === activeChat.messages.length - 1}
                  isStreaming={isLoading}
                  onRegenerate={handleRegenerate}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <footer className="flex-shrink-0 bg-transparent">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSend()}
            onStop={handleStop}
            isLoading={isLoading}
            selectedModel={settings.selectedModel}
            onOpenModelModal={() => setIsModelModalOpen(true)}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
            activeKeyName={activeKeyObj?.name}
            showSuggestions={!activeChat || activeChat.messages.length === 0}
          />
        </footer>
      </main>

      {/* Modals */}
      <KeyManagerModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        keys={keys}
        setKeys={setKeys}
        baseUrl={settings.baseUrl}
        setBaseUrl={(val) => setSettings((s) => ({ ...s, baseUrl: val }))}
        rotationMode={settings.rotationMode}
        setRotationMode={(val) => setSettings((s) => ({ ...s, rotationMode: val }))}
        activeKeyId={settings.activeKeyId}
        setActiveKeyId={(val) => setSettings((s) => ({ ...s, activeKeyId: val }))}
        onModelsUpdated={(newModels) => setModels(newModels)}
      />

      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        models={models}
        selectedModel={settings.selectedModel}
        onSelectModel={(modelId) => setSettings((s) => ({ ...s, selectedModel: modelId }))}
        onRefreshModels={handleRefreshModels}
        isRefreshing={isRefreshingModels}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        setSettings={setSettings}
        onClearAllChats={handleClearAllChats}
        onExportAllData={handleExportAllData}
        onImportData={handleImportData}
      />
    </div>
  );
}
