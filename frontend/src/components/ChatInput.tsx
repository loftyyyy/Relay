import { useState } from 'react';
import { useConnectionStore } from '../store/connectionStore';
import { ConnectionDot } from './ConnectionDot';

interface Props {
  onSend: (content: string) => void;
}

export function ChatInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const status = useConnectionStore((s) => s.status);
  const disabled = status !== 'connected';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 md:p-3 border-t border-border shrink-0">
      <ConnectionDot />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? 'Disconnected...' : 'Type a message...'}
        className="flex-1 bg-surface border border-border rounded px-3 py-2.5 md:py-2 text-base md:text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-accent disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="bg-accent text-white text-base md:text-sm px-5 py-2.5 md:px-4 md:py-2 rounded font-medium disabled:opacity-40 whitespace-nowrap"
      >
        Send
      </button>
    </form>
  );
}
