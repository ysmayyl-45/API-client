import React, { useState } from 'react';
import { 
  Key, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  Server
} from 'lucide-react';
import { fetchModelsFromKey, fetchAllModels, normalizeBaseUrl } from '../services/api';

export default function KeyManagerModal({
  isOpen,
  onClose,
  keys,
  setKeys,
  baseUrl,
  setBaseUrl,
  rotationMode,
  setRotationMode,
  activeKeyId,
  setActiveKeyId,
  onModelsUpdated,
}) {
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [testingId, setTestingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [baseUrlInput, setBaseUrlInput] = useState(baseUrl);

  if (!isOpen) return null;

  const toggleVisibility = (id) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddKey = (e) => {
    e.preventDefault();
    if (!newKeyValue.trim()) return;

    const newKey = {
      id: 'key_' + Date.now(),
      name: newKeyName.trim() || `Key #${keys.length + 1}`,
      key: newKeyValue.trim(),
      enabled: true,
      status: 'untested',
    };

    const updated = [...keys, newKey];
    setKeys(updated);
    if (!activeKeyId) setActiveKeyId(newKey.id);
    setNewKeyName('');
    setNewKeyValue('');
  };

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const newItems = lines.map((line, idx) => {
      let name = `Key #${keys.length + idx + 1}`;
      let val = line;
      if (line.includes(':') && !line.startsWith('http')) {
        const parts = line.split(':');
        name = parts[0].trim();
        val = parts.slice(1).join(':').trim();
      }
      return {
        id: 'key_' + (Date.now() + idx),
        name,
        key: val,
        enabled: true,
        status: 'untested',
      };
    });

    const updated = [...keys, ...newItems];
    setKeys(updated);
    if (!activeKeyId && updated.length > 0) setActiveKeyId(updated[0].id);
    setBulkText('');
    setShowBulk(false);
    setStatusMsg(`${newItems.length} keys added.`);
  };

  const handleDelete = (id) => {
    const updated = keys.filter((k) => k.id !== id);
    setKeys(updated);
    if (activeKeyId === id) setActiveKeyId(updated[0]?.id || null);
  };

  const handleTestKey = async (keyObj) => {
    setTestingId(keyObj.id);
    try {
      const models = await fetchModelsFromKey(baseUrlInput, keyObj.key);
      const updated = keys.map((k) => (k.id === keyObj.id ? { ...k, status: 'valid', modelCount: models.length } : k));
      setKeys(updated);
      setStatusMsg(`"${keyObj.name}" verified (${models.length} models).`);
    } catch (err) {
      const updated = keys.map((k) => (k.id === keyObj.id ? { ...k, status: 'invalid' } : k));
      setKeys(updated);
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      const activeKeys = keys.filter((k) => k.enabled);
      const models = await fetchAllModels(baseUrlInput, activeKeys);
      if (onModelsUpdated) onModelsUpdated(models);
      setStatusMsg(`Synced ${models.length} models from 9Router.`);
    } catch (err) {
      setStatusMsg(`Sync error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-xl bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-200">
            9Router API Keys
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Base URL */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">9Router Base URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="http://localhost:20128/v1"
                className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono outline-none focus:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => {
                  const normalized = normalizeBaseUrl(baseUrlInput);
                  setBaseUrl(normalized);
                  setBaseUrlInput(normalized);
                  setStatusMsg('Base URL saved.');
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>

          {/* Routing Strategy */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">Key Routing Strategy</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setRotationMode('failover')}
                className={`py-1.5 rounded-md transition text-center ${
                  rotationMode === 'failover' ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Auto-Failover
              </button>
              <button
                type="button"
                onClick={() => setRotationMode('round-robin')}
                className={`py-1.5 rounded-md transition text-center ${
                  rotationMode === 'round-robin' ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Round-Robin
              </button>
              <button
                type="button"
                onClick={() => setRotationMode('manual')}
                className={`py-1.5 rounded-md transition text-center ${
                  rotationMode === 'manual' ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex justify-between items-center">
              <span>{statusMsg}</span>
              <button onClick={() => setStatusMsg(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
            </div>
          )}

          {/* Keys list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Configured Keys ({keys.length})</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulk(!showBulk)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs transition"
                >
                  {showBulk ? 'Single Key' : 'Bulk Paste'}
                </button>
                <button
                  onClick={handleSyncAll}
                  className="text-zinc-200 hover:text-white text-xs transition"
                >
                  Sync Models
                </button>
              </div>
            </div>

            {showBulk ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Key1: sk-...&#10;Key2: sk-..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 outline-none focus:border-zinc-700"
                />
                <button
                  onClick={handleBulkAdd}
                  className="w-full py-1.5 bg-zinc-200 text-zinc-950 font-medium text-xs rounded-lg hover:bg-white transition"
                >
                  Add All
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddKey} className="flex gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Label (e.g. Key 1)"
                  className="w-1/3 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
                <input
                  type="password"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  placeholder="API Key (sk-...)"
                  className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono outline-none focus:border-zinc-700"
                />
                <button
                  type="submit"
                  disabled={!newKeyValue.trim()}
                  className="px-3 py-1.5 bg-zinc-200 hover:bg-white disabled:opacity-30 text-zinc-950 font-medium rounded-lg text-xs transition"
                >
                  Add
                </button>
              </form>
            )}

            {/* List */}
            <div className="space-y-1.5 pt-1">
              {keys.map((k) => {
                const isSelected = activeKeyId === k.id;
                const isVis = visibleKeys[k.id];

                return (
                  <div
                    key={k.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition ${
                      isSelected ? 'border-zinc-700 bg-zinc-900/90' : 'border-zinc-800/80 bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveKeyId(k.id)}
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-zinc-200 bg-zinc-200' : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && <div className="w-1 h-1 rounded-full bg-zinc-950" />}
                      </button>

                      <div className="min-w-0">
                        <div className="font-medium text-zinc-200 truncate">{k.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono truncate">
                          {isVis ? k.key : '••••••••••••••••'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleVisibility(k.id)}
                        className="p-1 text-zinc-500 hover:text-zinc-300"
                        title={isVis ? 'Hide' : 'Show'}
                      >
                        {isVis ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestKey(k)}
                        disabled={testingId === k.id}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition"
                      >
                        Test
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(k.id)}
                        className="p-1 text-zinc-500 hover:text-zinc-300"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
