import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRoomsStore } from '../store/roomsStore';
import { useInboxStore } from '../store/inboxStore';
import { useStompClient } from '../hooks/useStompClient';
import { Sidebar } from '../components/Sidebar';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { StatusBanner } from '../components/StatusBanner';

export function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username);
  const rooms = useRoomsStore((s) => s.rooms);
  const activeRoom = useRoomsStore((s) => s.activeRoom);
  const setActiveRoom = useRoomsStore((s) => s.setActiveRoom);
  const joinRoom = useRoomsStore((s) => s.joinRoom);
  const messages = useRoomsStore((s) => s.messages[roomId || 'general'] || []);
  const userCount = useRoomsStore((s) => (roomId ? s.userCounts[roomId] : undefined));
  const setActiveThread = useInboxStore((s) => s.setActiveThread);
  const { sendMessage, subscribeToRoom, unsubscribeFromRoom } = useStompClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const prevRoomRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!username) {
      navigate('/login');
      return;
    }
    if (!roomId) return;

    if (prevRoomRef.current && prevRoomRef.current !== roomId) {
      unsubscribeFromRoom(prevRoomRef.current);
    }

    if (!rooms.includes(roomId)) {
      joinRoom(roomId);
    }

    setActiveRoom(roomId);
    subscribeToRoom(roomId);
    prevRoomRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinRoom = (id: string) => {
    joinRoom(id);
    subscribeToRoom(id);
    navigate(`/room/${id}`);
  };

  if (!username) return null;

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
          <h2 className="text-sm font-medium text-gray-400 mb-4">
            # {activeRoom}
            {userCount ? <span className="ml-2 text-xs text-gray-500 font-normal">{userCount} online</span> : null}
          </h2>
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
        <ChatInput onSend={(content) => sendMessage(content, activeRoom)} />
      </div>
    </div>
  );
}
