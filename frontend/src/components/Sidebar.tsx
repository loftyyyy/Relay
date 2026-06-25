import { useState } from 'react';
import { useRoomsStore } from '../store/roomsStore';
import { useInboxStore } from '../store/inboxStore';
import { useAuthStore } from '../store/authStore';

interface Props {
  onRoomSelect: (roomId: string) => void;
  onDmSelect: (userId: string) => void;
  onJoinRoom: (roomId: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ onRoomSelect, onDmSelect, onJoinRoom, isMobileOpen, onMobileClose }: Props) {
  const [input, setInput] = useState('');
  const rooms = useRoomsStore((s) => s.rooms);
  const activeRoom = useRoomsStore((s) => s.activeRoom);
  const threads = useInboxStore((s) => s.threads);
  const activeThread = useInboxStore((s) => s.activeThread);
  const username = useAuthStore((s) => s.username);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const val = input.trim().toLowerCase().replace(/^#/, '');
    if (!val) return;
    onJoinRoom(val);
    setInput('');
  };

  const content = (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b border-border md:border-b-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Relay</p>
        <button
          onClick={onMobileClose}
          className="md:hidden p-1 text-gray-400 hover:text-gray-200 rounded"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Channels</p>
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => onRoomSelect(room)}
            className={`w-full text-left text-base md:text-sm px-2 min-h-[44px] md:min-h-0 py-1.5 rounded mb-0.5 ${
              activeRoom === room
                ? 'border-l-2 border-accent bg-accent/5 text-gray-100'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            # {room}
          </button>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="#room-name"
          className="mt-2 w-full bg-transparent border border-border rounded px-2 py-1.5 text-base md:text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-accent"
        />
      </div>
      {Object.keys(threads).length > 0 && (
        <div className="p-3 pt-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Direct Messages
          </p>
          {Object.keys(threads).map((userId) => (
            <button
              key={userId}
              onClick={() => onDmSelect(userId)}
              className={`w-full text-left text-base md:text-sm px-2 min-h-[44px] md:min-h-0 py-1.5 rounded mb-0.5 ${
                activeThread === userId
                  ? 'border-l-2 border-accent bg-accent/5 text-gray-100'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              @ {userId}
            </button>
          ))}
        </div>
      )}
      <div className="mt-auto px-3 py-2 text-xs text-gray-500 truncate">@{username}</div>
    </div>
  );

  return (
    <>
      {/* Overlay backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[75vw] max-w-[300px] bg-surface border-r border-border
          transform transition-transform duration-300 ease-in-out
          md:hidden
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-[200px] bg-surface border-r border-border flex-col overflow-y-auto shrink-0">
        {content}
      </aside>
    </>
  );
}
