import { useEffect, useRef } from 'react';
import { Client, type StompSubscription } from '@stomp/stompjs';
import { useAuthStore } from '../store/authStore';
import { useConnectionStore } from '../store/connectionStore';
import { useRoomsStore } from '../store/roomsStore';
import { useInboxStore } from '../store/inboxStore';
import type { ChatMessage } from '../types/chat';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const WS_BASE = API_BASE
  ? API_BASE.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
  : '';

async function loginApi(username: string): Promise<{ token: string; username: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    throw new Error('Login failed');
  }
  return res.json();
}

const sharedClient: { current: Client | null } = { current: null };
const sharedSubs: { current: Map<string, StompSubscription> } = { current: new Map() };
const reconnectAttempts: { current: number } = { current: 0 };

function nextReconnectDelay(): number {
  reconnectAttempts.current++;
  return Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
}

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

    reconnectAttempts.current = 0;

    const client = new Client({
      brokerURL: '', // avoid StompConfig warning; real URL set via webSocketFactory below
      webSocketFactory: () => {
        const host = WS_BASE || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
        return new WebSocket(`${host}/ws-chat?token=${token}`);
      },
      reconnectDelay: 1000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        reconnectAttempts.current = 0;
        client.reconnectDelay = 1000;
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
      onWebSocketClose: () => {
        client.reconnectDelay = nextReconnectDelay();
        setStatus('reconnecting');
      },
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
    const { token } = await loginApi(username);

    return new Promise<void>((resolve, reject) => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        subsRef.current.clear();
      }

      let settled = false;

      const client = new Client({
        brokerURL: '', // avoid StompConfig warning; real URL set via webSocketFactory below
        webSocketFactory: () => {
          const host = WS_BASE || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
          return new WebSocket(`${host}/ws-chat?token=${token}`);
        },
        reconnectDelay: 1000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          if (settled) return;
          settled = true;
          reconnectAttempts.current = 0;
          client.reconnectDelay = 1000;
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
          client.reconnectDelay = nextReconnectDelay();
          setStatus('reconnecting');
        },
      });

      client.activate();
    });
  };

  return { connect, sendMessage, sendPrivateMessage, subscribeToRoom, unsubscribeFromRoom };
}
