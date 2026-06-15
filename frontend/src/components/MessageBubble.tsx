import { useAuthStore } from '../store/authStore';
import type { ChatMessage } from '../types/chat';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const username = useAuthStore((s) => s.username);
  const isOwn = message.sender === username;

  if (message.type === 'JOIN' || message.type === 'LEAVE' || message.type === 'SYSTEM') {
    return <p className="text-center text-sm text-gray-500 py-2">{message.content}</p>;
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && <span className="text-xs text-gray-500 mb-0.5 ml-1">{message.sender}</span>}
        <div
          className={`px-3 py-2 rounded ${
            isOwn ? 'bg-accent/20 text-gray-100' : 'bg-surface text-gray-200'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
