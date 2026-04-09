import { useState, useRef, useEffect } from 'react';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { useAuthStore } from '../../store/useAuthStore';

export const ChatPanel = () => {
  const [input, setInput] = useState('');
  const { messages, users } = useCollaborationStore();
  const { user } = useAuthStore();

  const currentUserId = user?.id || user?._id || '';
  const currentUserName = user?.username || user?.name || 'Anonymous';
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const projectId = (window as any).__collabProjectId;

    // Get the collaborative engine from the global scope
    // The engine exposes sendMessage which handles both Yjs sync and socket relay
    const engine = (window as any).__collabEngine;

    if (engine && projectId) {
      engine.sendMessage(input.trim(), { id: currentUserId, name: currentUserName }, projectId);
    } else {
      // Fallback: direct Yjs insertion if engine not available via global
      const doc = (window as any).__collabDoc;
      if (doc) {
        const ymessages = doc.getArray('messages');
        const { Map: YMap } = require('yjs');
        const msg = new YMap();
        msg.set('id', Math.random().toString(36).substring(2, 11));
        msg.set('senderId', currentUserId);
        msg.set('senderName', currentUserName);
        msg.set('text', input.trim());
        msg.set('timestamp', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        msg.set('seenBy', []);
        ymessages.push([msg]);

        const appSocket = (window as any).__appSocket;
        appSocket?.emit('chat-message', {
          projectId,
          message: {
            id: msg.get('id'),
            senderId: currentUserId,
            senderName: currentUserName,
            text: input.trim(),
            timestamp: msg.get('timestamp'),
            seenBy: [],
          },
        });
      }
    }
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d12] border-l border-[#1e2a3a]">
      {/* Header */}
      <div className="p-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111720]">
        <h3 className="text-sm font-semibold text-[#f1f3fc] font-['Space_Grotesk']">Collaborative Chat</h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-[#8a98b3] font-mono">{users.length} Online</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1e2a3a]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-xs text-[#8a98b3] text-center">No messages yet.<br/>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-bold text-[#8a98b3] uppercase tracking-tighter">
                    {isMine ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[9px] text-[#3a4458]">{msg.timestamp}</span>
                </div>
                <div className={`relative px-3 py-2 rounded-2xl text-sm max-w-[90%] break-words shadow-sm ${
                  isMine
                    ? 'bg-[#a78bfa] text-white rounded-tr-none'
                    : 'bg-[#1e2a3a] text-[#f1f3fc] rounded-tl-none'
                }`}>
                  {msg.text}

                  {/* Seen status */}
                  {isMine && (
                    <div className="absolute -bottom-4 right-0 flex items-center gap-1 mt-1 px-1">
                      {msg.seenBy?.length > 0 ? (
                        <span className="text-[#a78bfa] flex" title={`Seen by ${msg.seenBy.length} others`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>
                        </span>
                      ) : (
                        <span className="text-[#3a4458]" title="Sent">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-[#1e2a3a] bg-[#111720]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[#0a0d12] border border-[#1e2a3a] rounded-xl px-4 py-2.5 text-sm text-[#f1f3fc] placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-all pr-12"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1.5 bottom-1.5 px-3 rounded-lg bg-[#a78bfa]/10 text-[#a78bfa] hover:bg-[#a78bfa] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
