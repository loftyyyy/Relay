import { useConnectionStore } from '../store/connectionStore';

const dotColors: Record<string, string> = {
  connected: 'bg-connected',
  reconnecting: 'bg-reconnecting',
  disconnected: 'bg-disconnected',
};

export function ConnectionDot() {
  const status = useConnectionStore((s) => s.status);
  return <span className={`inline-block w-2 h-2 rounded-full ${dotColors[status]}`} />;
}
