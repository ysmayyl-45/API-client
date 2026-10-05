import React, { useState, useMemo } from 'react';
import { Search, Check, RefreshCw, X } from 'lucide-react';

// Universal starter reference models if 9Router has not synced yet
export const DEFAULT_PRESET_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', isCombo: false, description: 'OpenAI flagship multimodal intelligence' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', isCombo: false, description: 'Fast, lightweight and cost-effective model' },
  { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', isCombo: false, description: 'Anthropic state-of-the-art coding and reasoning' },
  { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', isCombo: false, description: 'Google multimodal high-capacity model' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'deepseek', isCombo: false, description: 'Leading open architecture reasoning model' },
  { id: 'meta/llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'meta', isCombo: false, description: 'Open weights industry standard model' },
  { id: 'combo:default', name: 'Default Fallback Combo', provider: 'combo', isCombo: true, description: 'Virtual auto-failover combo across available providers' },
];

const formatProviderLabel = (prov) => {
  if (!prov) return 'Other';
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
    cohere: 'Cohere',
  };
  return map[prov.toLowerCase()] || (prov.charAt(0).toUpperCase() + prov.slice(1));
};

export default function ModelSelectorModal({
  isOpen,
  onClose,
  models = [],
  selectedModel,
  onSelectModel,
  onRefreshModels,
  isRefreshing = false,
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const effectiveModels = useMemo(() => {
    return models.length > 0 ? models : DEFAULT_PRESET_MODELS;
  }, [models]);

  // Dynamically generate category tabs from whatever models exist in the gateway
  const dynamicCategories = useMemo(() => {
    const providerSet = new Set();
    let hasCombos = false;

    effectiveModels.forEach((m) => {
      if (m.isCombo) {
        hasCombos = true;
      } else if (m.provider && m.provider !== 'other') {
        providerSet.add(m.provider);
      }
    });

    const result = [{ id: 'all', label: 'All' }];
    if (hasCombos) {
      result.push({ id: 'combo', label: 'Combos' });
    }
    Array.from(providerSet)
      .sort()
      .forEach((prov) => {
        result.push({ id: prov, label: formatProviderLabel(prov) });
      });

    return result;
  }, [effectiveModels]);

  const displayModels = useMemo(() => {
    return effectiveModels.filter((m) => {
      const matchSearch =
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        (m.name && m.name.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'combo') return m.isCombo || m.provider === 'combo';
      return m.provider === selectedCategory;
    });
  }, [effectiveModels, search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">
              Select Model
            </h2>
            <p className="text-[11px] text-zinc-500">
              {models.length > 0 ? `${models.length} models discovered from 9Router` : 'Default reference models (click Sync to load yours)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Dynamic Categories */}
        <div className="p-3.5 border-b border-zinc-800/60 space-y-2.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 placeholder-zinc-500"
                autoFocus
              />
            </div>
            {onRefreshModels && (
              <button
                onClick={onRefreshModels}
                disabled={isRefreshing}
                title="Sync live models from 9Router"
                className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg text-xs transition flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            )}
          </div>

          {/* Dynamic Categories Scrollbar */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {dynamicCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-200 text-zinc-950 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model List */}
        <div className="p-2 space-y-0.5 overflow-y-auto max-h-[60vh]">
          {displayModels.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No matching models found
            </div>
          ) : (
            displayModels.map((m) => {
              const isSelected = selectedModel === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectModel(m.id);
                    onClose();
                  }}
                  className={`p-2.5 rounded-lg cursor-pointer transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-zinc-800/80 text-zinc-100'
                      : 'hover:bg-zinc-900/60 text-zinc-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-zinc-100 truncate">
                        {m.name || m.id}
                      </span>
                      {m.isCombo && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Combo
                        </span>
                      )}
                      {!m.isCombo && m.provider && m.provider !== 'other' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                          {formatProviderLabel(m.provider)}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                      {m.id}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-zinc-200 flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
