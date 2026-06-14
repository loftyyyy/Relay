import { create } from 'zustand';

interface AuthState {
  username: string | null;
  token: string | null;
  login: (username: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  token: null,
  login: (username, token) => set({ username, token }),
  logout: () => set({ username: null, token: null }),
}));
