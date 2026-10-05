import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square, ChevronDown } from 'lucide-react';

const MINIMAL_SUGGESTIONS = [
  'Write an async API client in Python',
  'Simplify and explain this code snippet',
  'Benchmark response speed of 9Router models',
  'Minimalist design principles for user experience',
];

export default function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isLoading,
  selectedModel,
  onOpenModelModal,
  onOpenKeyModal,
  activeKeyName,
  showSuggestions = false,
}) {
  const textareaRef = useRef(null);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-6 pt-2">
      {/* Subtle suggestions on empty chat */}
      {showSuggestions && (
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          {MINIMAL_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(item);
                if (textareaRef.current) textareaRef.current.focus();
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/80 px-3 py-1.5 rounded-full transition"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Floating Minimalist Capsule */}
      <div className="relative rounded-2xl bg-zinc-900/85 border border-zinc-800/80 focus-within:border-zinc-700/90 shadow-xl shadow-black/40 backdrop-blur-md transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full pt-3.5 pb-2 px-4 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none outline-none leading-relaxed"
        />

        {/* Bottom row */}
        <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            {/* Model Pill */}
            <button
              type="button"
              onClick={onOpenModelModal}
              className="flex items-center gap-1 py-1 px-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition font-medium text-[11px]"
            >
              <span>{selectedModel}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {/* Key Pill */}
            <button
              type="button"
              onClick={onOpenKeyModal}
              className="py-1 px-2 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition text-[11px]"
            >
              {activeKeyName || 'Key'}
            </button>
          </div>

          <div>
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center transition"
                title="Stop generating"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!input.trim()}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-white disabled:opacity-20 text-zinc-950 flex items-center justify-center transition shadow-xs"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
