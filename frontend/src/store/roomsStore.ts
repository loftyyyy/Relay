import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface RoomsState {
  activeRoom: string;
  rooms: string[];
  messages: Record<string, ChatMessage[]>;
  setActiveRoom: (roomId: string) => void;
  addMessage: (roomId: string, message: ChatMessage) => void;
  joinRoom: (roomId: string) => void;
}

export const useRoomsStore = create<RoomsState>((set) => ({
  activeRoom: 'general',
  rooms: ['general', 'random'],
  messages: { general: [], random: [] },
  setActiveRoom: (roomId) => set({ activeRoom: roomId }),
  addMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    })),
  joinRoom: (roomId) =>
    set((state) => {
      if (state.rooms.includes(roomId)) return state;
      return { rooms: [...state.rooms, roomId], messages: { ...state.messages, [roomId]: [] } };
    }),
}));
