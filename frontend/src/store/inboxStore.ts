import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface InboxState {
  threads: Record<string, ChatMessage[]>;
  activeThread: string | null;
  setActiveThread: (userId: string | null) => void;
  addMessage: (userId: string, message: ChatMessage) => void;
}

export const useInboxStore = create<InboxState>((set) => ({
  threads: {},
  activeThread: null,
  setActiveThread: (userId) => set({ activeThread: userId }),
  addMessage: (userId, message) =>
    set((state) => ({
      threads: {
        ...state.threads,
        [userId]: [...(state.threads[userId] || []), message],
      },
    })),
}));
