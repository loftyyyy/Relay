import { useEffect, useRef } from 'react';
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

  const handleJoinRoom = (id: string) => {
    joinRoom(id);
    subscribeToRoom(id);
    navigate(`/room/${id}`);
  };

  if (!username || !userId) return null;

  return (
    <div className="h-full flex">
      <Sidebar
        onRoomSelect={(id) => navigate(`/room/${id}`)}
        onDmSelect={(id) => navigate(`/dm/${id}`)}
        onJoinRoom={handleJoinRoom}
      />
      <div className="flex-1 flex flex-col">
        <StatusBanner />
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-sm font-medium text-gray-400 mb-4">@ {userId}</h2>
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
