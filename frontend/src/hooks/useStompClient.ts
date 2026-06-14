import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { useAuthStore } from '../store/authStore';
import { useConnectionStore } from '../store/connectionStore';
import { useRoomsStore } from '../store/roomsStore';
import { useInboxStore } from '../store/inboxStore';
import { SignJWT } from 'jose';
import type { ChatMessage } from '../types/chat';

const JWT_SECRET_B64 = 'ZXhjaXRlbWVudHNvaWxzaXN0ZXJkZXNlcnRjbG9zZXRydXRoZHJpZWRvdXR0cm91Ymw=';

async function generateToken(username: string): Promise<string> {
  const secret = Uint8Array.from(atob(JWT_SECRET_B64), (c) => c.charCodeAt(0));
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt()
    .sign(secret);
}

export function useStompClient() {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  const { username, token, login } = useAuthStore();
  const { setStatus } = useConnectionStore();
  const { addMessage: addRoomMessage, activeRoom, rooms } = useRoomsStore();
  const { addMessage: addInboxMessage } = useInboxStore();

  useEffect(() => {
    if (!username || !token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`/ws-chat?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus('connected');

        rooms.forEach((roomId) => {
          const sub = client.subscribe(`/topic/rooms/${roomId}`, (msg) => {
            const chatMessage: ChatMessage = JSON.parse(msg.body);
            addRoomMessage(roomId, chatMessage);
          });
          subscriptionsRef.current.add(roomId);
        });

        client.subscribe('/user/queue/messages', (msg) => {
          const chatMessage: ChatMessage = JSON.parse(msg.body);
          addInboxMessage(chatMessage.sender, chatMessage);
        });
      },
      onDisconnect: () => {
        setStatus('disconnected');
      },
      onStompError: () => {
        setStatus('disconnected');
      },
      onWebSocketClose: () => {
        setStatus('reconnecting');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [username, token]);

  const subscribeToRoom = (roomId: string) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;
    if (subscriptionsRef.current.has(roomId)) return;

    client.subscribe(`/topic/rooms/${roomId}`, (msg) => {
      const chatMessage: ChatMessage = JSON.parse(msg.body);
      addRoomMessage(roomId, chatMessage);
    });
    subscriptionsRef.current.add(roomId);
  };

  const sendMessage = (content: string, roomId: string) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        content,
        roomId,
        type: 'CHAT',
      } satisfies Omit<ChatMessage, 'sender'>),
    });
  };

  const sendPrivateMessage = (content: string, targetUser: string) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    client.publish({
      destination: `/app/chat.private.${targetUser}`,
      body: JSON.stringify({
        content,
        roomId: targetUser,
        type: 'CHAT',
      } satisfies Omit<ChatMessage, 'sender'>),
    });
  };

  const connect = async (username: string) => {
    const token = await generateToken(username);
    login(username, token);
  };

  return { connect, sendMessage, sendPrivateMessage, subscribeToRoom };
}
