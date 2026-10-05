import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Key, 
  Settings2, 
  Search,
  MessageSquare
} from 'lucide-react';

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onOpenKeyModal,
  onOpenSettingsModal,
  isOpen,
  setIsOpen,
  keysCount,
}) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const startEditing = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  };

  const saveEditing = (id, e) => {
    e?.stopPropagation();
    if (editingTitle.trim()) {
      onRenameChat(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0c0c0e] border-r border-zinc-800/60 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-zinc-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-tight text-zinc-100">
              9Router Studio
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/80"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-2.5 pb-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-600">
              {search ? 'No results found' : 'No conversations yet'}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = editingId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`group relative px-2.5 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                    isActive
                      ? 'bg-zinc-800/70 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:bg-zinc-900/70 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={(e) => saveEditing(chat.id, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing(chat.id, e);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 rounded text-xs text-zinc-100 outline-none w-full"
                      />
                    ) : (
                      <span className="truncate">{chat.title}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                    {isEditing ? (
                      <button
                        onClick={(e) => saveEditing(chat.id, e)}
                        className="p-1 hover:text-zinc-200 text-zinc-500"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => startEditing(chat, e)}
                        className="p-1 hover:text-zinc-200 text-zinc-500"
                        title="Rename"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.id);
                      }}
                      className="p-1 hover:text-zinc-300 text-zinc-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Minimal Bottom Panel */}
        <div className="p-2 border-t border-zinc-800/40 flex items-center justify-between text-xs text-zinc-500">
          <button
            onClick={onOpenKeyModal}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-zinc-900 hover:text-zinc-300 transition"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{keysCount} {keysCount === 1 ? 'Key' : 'Keys'}</span>
          </button>

          <button
            onClick={onOpenSettingsModal}
            className="p-1.5 rounded-md hover:bg-zinc-900 hover:text-zinc-300 transition"
            title="Settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
}
