// WHAT: Socket.io client hook for real-time messaging and notifications
// WHY: Single connection instance shared across the app

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    globalSocket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return globalSocket;
}

export function useSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    if (userId && socket.connected) {
      socket.emit('join', userId);
    }

    const onConnect = () => {
      if (userId) socket.emit('join', userId);
    };

    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
    };
  }, [userId]);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, emit, on, off };
}
