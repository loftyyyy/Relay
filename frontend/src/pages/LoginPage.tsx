import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStompClient } from '../hooks/useStompClient';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const { connect } = useStompClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    await connect(username.trim());
    navigate('/room/general');
  };

  return (
    <div className="h-full flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-72">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoFocus
          className="bg-surface border border-border rounded px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!username.trim()}
          className="bg-accent text-white text-sm px-4 py-2.5 rounded font-medium disabled:opacity-40"
        >
          Connect
        </button>
      </form>
    </div>
  );
}
