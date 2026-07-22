'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api';

const SocketContext = createContext(null);
const SOCKET_APP_SECRET = process.env.NEXT_PUBLIC_APP_SECRET;

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());
  const restaurantRoomsRef = useRef(new Set());
  const orderRoomsRef = useRef(new Set());

  useEffect(() => {
    let socket = null;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        socket = io(API_BASE_URL, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
          ...(SOCKET_APP_SECRET ? { auth: { appSecret: SOCKET_APP_SECRET } } : {}),
          ...(SOCKET_APP_SECRET ? { extraHeaders: { 'x-app-secret': SOCKET_APP_SECRET } } : {})
        });

        socket.on('connect', () => {
          restaurantRoomsRef.current.forEach((room) => {
            socket.emit('join_restaurant', room);
          });
          orderRoomsRef.current.forEach((orderId) => {
            socket.emit('join_order', orderId);
          });
          setIsConnected(true);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        socketRef.current = socket;
        listenersRef.current.forEach((callbacks, event) => {
          callbacks.forEach((callback) => socket.on(event, callback));
        });
      } catch (error) {
        console.warn('Socket.io connection failed:', error.message);
      }
    };

    connect();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const joinRoom = useCallback((room) => {
    if (!room) return;
    restaurantRoomsRef.current.add(room.toString());
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_restaurant', room.toString());
    }
  }, []);

  const joinOrderRoom = useCallback((orderId) => {
    if (!orderId) return;
    orderRoomsRef.current.add(orderId.toString());
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_order', orderId.toString());
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, []);
    }
    const callbacks = listenersRef.current.get(event);
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (listenersRef.current.has(event)) {
      listenersRef.current.set(
        event,
        listenersRef.current.get(event).filter((registered) => registered !== callback)
      );
    }
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    joinOrderRoom,
    on,
    off,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
