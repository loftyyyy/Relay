import { useRoomsStore } from '../store/roomsStore';
import { useInboxStore } from '../store/inboxStore';

interface Props {
  onRoomSelect: (roomId: string) => void;
  onDmSelect: (userId: string) => void;
}

export function Sidebar({ onRoomSelect, onDmSelect }: Props) {
  const rooms = useRoomsStore((s) => s.rooms);
  const activeRoom = useRoomsStore((s) => s.activeRoom);
  const threads = useInboxStore((s) => s.threads);
  const activeThread = useInboxStore((s) => s.activeThread);

  return (
    <aside className="w-[200px] bg-surface border-r border-border flex flex-col overflow-y-auto">
      <div className="p-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Channels</p>
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => onRoomSelect(room)}
            className={`w-full text-left text-sm px-2 py-1.5 rounded mb-0.5 ${
              activeRoom === room
                ? 'border-l-2 border-accent bg-accent/5 text-gray-100'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            # {room}
          </button>
        ))}
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
              className={`w-full text-left text-sm px-2 py-1.5 rounded mb-0.5 ${
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
    </aside>
  );
}
