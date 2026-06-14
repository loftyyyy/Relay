import { useConnectionStore } from '../store/connectionStore';

const labels: Record<string, string> = {
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
};

export function StatusBanner() {
  const status = useConnectionStore((s) => s.status);
  if (status === 'connected') return null;

  return (
    <div className="text-center text-sm py-1.5 bg-disconnected/10 text-disconnected border-b border-disconnected/20">
      {labels[status]}
    </div>
  );
}
