export type MessageType = 'CHAT' | 'JOIN' | 'LEAVE' | 'SYSTEM';

export interface ChatMessage {
  sender: string;
  content: string;
  roomId: string;
  type: MessageType;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
