import { useEffect, useRef } from 'react';
import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { useAuthStore } from '../store/authStore';
import { useConnectionStore } from '../store/connectionStore';
import { useRoomsStore } from '../store/roomsStore';
import { useInboxStore } from '../store/inboxStore';
import { SignJWT } from 'jose';
import type { ChatMessage } from '../types/chat';

const JWT_SECRET_B64 = import.meta.env.VITE_JWT_SECRET || 'ZXhjaXRlbWVudHNvaWxzaXN0ZXJkZXNlcnRjbG9zZXRydXRoZHJpZWRvdXR0cm91Ymw=';

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
  const subsRef = useRef<Map<string, StompSubscription>>(new Map());

  const { username, token, login } = useAuthStore();
  const { setStatus } = useConnectionStore();
  const { addMessage: addRoomMessage, activeRoom } = useRoomsStore();
  const { addMessage: addInboxMessage } = useInboxStore();
  const roomsRef = useRef(useRoomsStore.getState().rooms);
  useRoomsStore.subscribe((state) => { roomsRef.current = state.rooms; });

  useEffect(() => {
    if (!username || !token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`/ws-chat?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus('connected');
        subsRef.current.clear();

        const currentRooms = roomsRef.current;
        currentRooms.forEach((roomId) => {
          const sub = client.subscribe(`/topic/rooms/${roomId}`, (msg) => {
            const chatMessage: ChatMessage = JSON.parse(msg.body);
            addRoomMessage(roomId, chatMessage);
          });
          subsRef.current.set(roomId, sub);
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
      subsRef.current.clear();
    };
  }, [username, token]);

  const subscribeToRoom = (roomId: string) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;
    if (subsRef.current.has(roomId)) return;

    const sub = client.subscribe(`/topic/rooms/${roomId}`, (msg) => {
      const chatMessage: ChatMessage = JSON.parse(msg.body);
      addRoomMessage(roomId, chatMessage);
    });
    subsRef.current.set(roomId, sub);
  };

  const unsubscribeFromRoom = (roomId: string) => {
    const sub = subsRef.current.get(roomId);
    if (sub) {
      sub.unsubscribe();
      subsRef.current.delete(roomId);
    }
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
        sender: username ?? '',
      } satisfies ChatMessage),
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
        sender: username ?? '',
      } satisfies ChatMessage),
    });
  };

  const connect = async (username: string) => {
    const token = await generateToken(username);
    login(username, token);
  };

  return { connect, sendMessage, sendPrivateMessage, subscribeToRoom, unsubscribeFromRoom };
}
