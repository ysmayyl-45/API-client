import React from 'react';
import { X, Download, Upload, Trash2 } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  setSettings,
  onClearAllChats,
  onExportAllData,
  onImportData,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-200">
            Parameters & Settings
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* System Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium">System Prompt</label>
            <textarea
              rows={3}
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              placeholder="Instructions for the AI assistant..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-zinc-700"
            />
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Temperature</span>
              <span className="font-mono text-zinc-200">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full accent-zinc-200 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>0.0 (Deterministic)</span>
              <span>1.0 (Balanced)</span>
              <span>2.0 (Creative)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Max Tokens</span>
              <span className="font-mono text-zinc-200">{settings.maxTokens}</span>
            </div>
            <input
              type="range"
              min="512"
              max="16384"
              step="512"
              value={settings.maxTokens}
              onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
              className="w-full accent-zinc-200 cursor-pointer"
            />
          </div>

          {/* Stream */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
            <div>
              <div className="text-xs font-medium text-zinc-300">Streaming (SSE)</div>
              <div className="text-[11px] text-zinc-500">Stream response tokens in real time</div>
            </div>
            <input
              type="checkbox"
              checked={settings.stream}
              onChange={(e) => setSettings({ ...settings, stream: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 cursor-pointer accent-zinc-200"
            />
          </div>

          {/* Backup / Clear */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportAllData}
                className="py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition flex items-center justify-center gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export Backup (JSON)
              </button>

              <label className="py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition flex items-center justify-center gap-1.5 text-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Import Backup
                <input type="file" accept=".json" onChange={onImportData} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={onClearAllChats}
              className="w-full py-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition text-xs flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Chat History
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
