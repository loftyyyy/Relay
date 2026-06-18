import { useEffect, useRef } from 'react';
import { Client, type StompSubscription } from '@stomp/stompjs';
import { useAuthStore } from '../store/authStore';
import { useConnectionStore } from '../store/connectionStore';
import { useRoomsStore } from '../store/roomsStore';
import { useInboxStore } from '../store/inboxStore';
import { SignJWT } from 'jose';
import type { ChatMessage } from '../types/chat';

async function generateToken(username: string): Promise<string> {
  const secretB64 = import.meta.env.VITE_JWT_SECRET;
  if (!secretB64) {
    throw new Error('VITE_JWT_SECRET is not set. Create frontend/.env with VITE_JWT_SECRET=<base64-encoded-secret>');
  }
  const secret = Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0));
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(username)
    .setIssuedAt()
    .sign(secret);
}

const sharedClient: { current: Client | null } = { current: null };
const sharedSubs: { current: Map<string, StompSubscription> } = { current: new Map() };

export function useStompClient() {
  const clientRef = sharedClient;
  const subsRef = sharedSubs;

  const { username, token, login } = useAuthStore();
  const { setStatus } = useConnectionStore();
  const { addMessage: addRoomMessage, activeRoom } = useRoomsStore();
  const { addMessage: addInboxMessage } = useInboxStore();
  const roomsRef = useRef(useRoomsStore.getState().rooms);
  useRoomsStore.subscribe((state) => { roomsRef.current = state.rooms; });

  useEffect(() => {
    if (!username || !token) return;
    if (clientRef.current) return;

    const client = new Client({
      webSocketFactory: () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return new WebSocket(`${protocol}//${window.location.host}/ws-chat?token=${token}`);
      },
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
      onDisconnect: () => setStatus('disconnected'),
      onStompError: () => setStatus('disconnected'),
      onWebSocketClose: () => setStatus('reconnecting'),
    });

    client.activate();
    clientRef.current = client;
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

  const connect = async (username: string): Promise<void> => {
    const token = await generateToken(username);

    return new Promise<void>((resolve, reject) => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        subsRef.current.clear();
      }

      let settled = false;

      const client = new Client({
        webSocketFactory: () => {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          return new WebSocket(`${protocol}//${window.location.host}/ws-chat?token=${token}`);
        },
        reconnectDelay: 5000,
        onConnect: () => {
          if (settled) return;
          settled = true;
          login(username, token);
          setStatus('connected');
          clientRef.current = client;

          const currentRooms = roomsRef.current;
          currentRooms.forEach((roomId) => {
            if (subsRef.current.has(roomId)) return;
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

          resolve();
        },
        onDisconnect: () => setStatus('disconnected'),
        onStompError: () => {
          if (!settled) {
            settled = true;
            reject(new Error('Unable to connect'));
          }
          setStatus('disconnected');
        },
        onWebSocketClose: () => {
          if (!settled) {
            settled = true;
            reject(new Error('Username already taken. Choose a different one.'));
          }
          setStatus('reconnecting');
        },
      });

      client.activate();
    });
  };

  return { connect, sendMessage, sendPrivateMessage, subscribeToRoom, unsubscribeFromRoom };
}
