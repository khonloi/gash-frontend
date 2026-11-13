import { io, Socket } from 'socket.io-client';
import { getOrCreateGuestId, isDemoModeActive } from './apiClient';
import { STORAGE_KEYS } from '@/constants/site';

let socket: Socket | null = null;
let lastToken: string | null = null;
let lastGuestId: string | null = null;

function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.accessToken || null;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

export function getChatSocket(token?: string | null, guestId?: string | null): Socket | null {
  if (typeof window === 'undefined') return null;
  if (isDemoModeActive()) return null;

  const resolvedToken = (token !== undefined ? token : readStoredToken()) || null;
  const resolvedGuestId = (guestId !== undefined ? guestId : getOrCreateGuestId()) || null;

  if (socket) {
    if (resolvedToken !== lastToken || resolvedGuestId !== lastGuestId) {
      lastToken = resolvedToken;
      lastGuestId = resolvedGuestId;
      socket.auth = {
        token: resolvedToken || undefined,
        guestId: resolvedGuestId || undefined,
      };
      if (socket.connected) {
        socket.disconnect().connect();
      } else {
        socket.connect();
      }
    } else if (!socket.connected && !socket.active) {
      socket.connect();
    }
    return socket;
  }

  lastToken = resolvedToken;
  lastGuestId = resolvedGuestId;
  const socketUrl = getSocketUrl();

  socket = io(socketUrl, {
    auth: {
      token: resolvedToken || undefined,
      guestId: resolvedGuestId || undefined,
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.io.on('reconnect_attempt', () => {
    if (!socket) return;
    const latestToken = readStoredToken();
    const latestGuestId = getOrCreateGuestId();
    lastToken = latestToken;
    lastGuestId = latestGuestId;
    socket.auth = {
      token: latestToken || undefined,
      guestId: latestGuestId || undefined,
    };
  });

  return socket;
}

export function disconnectChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastToken = null;
    lastGuestId = null;
  }
}
