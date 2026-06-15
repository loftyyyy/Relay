export type MessageType = 'CHAT' | 'JOIN' | 'LEAVE' | 'SYSTEM';

export interface ChatMessage {
  sender: string;
  content: string;
  roomId: string;
  type: MessageType;
  userCount?: number;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
