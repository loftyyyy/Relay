import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useInboxStore } from '../store/inboxStore';
import { useRoomsStore } from '../store/roomsStore';
import { useStompClient } from '../hooks/useStompClient';
import { Sidebar } from '../components/Sidebar';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { StatusBanner } from '../components/StatusBanner';

export function DMThreadPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username);
  const setActiveThread = useInboxStore((s) => s.setActiveThread);
  const messages = useInboxStore((s) => (userId ? s.threads[userId] || [] : []));
  const { sendPrivateMessage, subscribeToRoom } = useStompClient();
  const joinRoom = useRoomsStore((s) => s.joinRoom);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }
    if (userId) setActiveThread(userId);
    return () => setActiveThread(null);
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!username || !userId) return null;

  const handleJoinRoom = (id: string) => {
    joinRoom(id);
    subscribeToRoom(id);
    navigate(`/room/${id}`);
  };

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar
        onRoomSelect={(id) => { navigate(`/room/${id}`); setSidebarOpen(false); }}
        onDmSelect={(id) => { navigate(`/dm/${id}`); setSidebarOpen(false); }}
        onJoinRoom={(id) => { handleJoinRoom(id); setSidebarOpen(false); }}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <StatusBanner />
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-gray-400 hover:text-gray-200 rounded"
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h2 className="text-sm font-medium text-gray-400 truncate">@ {userId}</h2>
        </div>
        {/* Message list */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {/* Desktop header */}
          <h2 className="hidden md:block text-sm font-medium text-gray-400 mb-4">@ {userId}</h2>
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
        <ChatInput onSend={(content) => sendPrivateMessage(content, userId)} />
      </div>
    </div>
  );
}
