import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';

export default function ChatMessage({
  message,
  onRegenerate,
  isLast,
  isStreaming = false,
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  if (isUser) {
    return (
      <div className="py-4 px-4 sm:px-6 max-w-3xl mx-auto flex justify-end group">
        <div className="relative max-w-[85%] sm:max-w-[75%] rounded-2xl bg-zinc-800/90 text-zinc-100 px-4 py-3 text-sm leading-relaxed shadow-xs border border-zinc-700/50">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          <button
            onClick={handleCopyMessage}
            className="absolute -left-8 top-3 p-1 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-zinc-300" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="py-5 px-4 sm:px-6 max-w-3xl mx-auto group">
      <div className="space-y-2">
        {/* Subtle Header */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-300 tracking-tight">
              {message.model || 'Assistant'}
            </span>
            {message.keyUsed && (
              <span className="text-[11px] text-zinc-500">
                • {message.keyUsed.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={handleCopyMessage}
              className="p-1 text-zinc-500 hover:text-zinc-200 transition"
              title="Copy Message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-zinc-300" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onRegenerate && isLast && !isStreaming && (
              <button
                onClick={onRegenerate}
                className="p-1 text-zinc-500 hover:text-zinc-200 transition ml-1"
                title="Regenerate Response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Reasoning / Thinking foldout */}
        {message.reasoning && (
          <div className="my-2 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/40 text-xs">
            <button
              type="button"
              onClick={() => setShowReasoning(!showReasoning)}
              className="w-full px-3 py-1.5 flex items-center justify-between text-zinc-400 hover:text-zinc-200 transition"
            >
              <span className="text-[11px] uppercase tracking-wider font-medium text-zinc-500">
                Reasoning Process
              </span>
              {showReasoning ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {showReasoning && (
              <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed text-[11px] max-h-56 overflow-y-auto">
                {message.reasoning}
              </div>
            )}
          </div>
        )}

        {/* Markdown Content */}
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (!inline && match) {
                  const lang = match[1];
                  const codeIndex = node?.position?.start?.line || Math.random();

                  return (
                    <div className="relative my-3 rounded-lg overflow-hidden border border-zinc-800 bg-[#101012] font-mono text-xs">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800/60 text-zinc-400">
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {lang}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(codeString, codeIndex)}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
                        >
                          {copiedCodeIndex === codeIndex ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3.5 overflow-x-auto text-zinc-200 leading-relaxed bg-transparent">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                }

                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {isStreaming && isLast && (
            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-zinc-400 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
