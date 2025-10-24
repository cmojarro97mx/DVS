import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification } from '../services/notificationsService';

interface UseNotificationsSocketOptions {
  onNotification?: (notification: Notification) => void;
  enabled?: boolean;
}

export const useNotificationsSocket = (options: UseNotificationsSocketOptions = {}) => {
  const { onNotification, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found for WebSocket connection');
      return;
    }

    const socket = io('http://localhost:3001', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected for notifications');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('notification', (notification: Notification) => {
      console.log('📬 New notification received via WebSocket:', notification);
      if (onNotification) {
        onNotification(notification);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled, onNotification]);

  return {
    isConnected,
    socket: socketRef.current
  };
};
