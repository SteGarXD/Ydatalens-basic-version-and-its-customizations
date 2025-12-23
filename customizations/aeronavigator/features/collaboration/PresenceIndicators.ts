/**
 * Presence Indicators Module
 * Индикаторы присутствия пользователей
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializePresence = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8080';
    socket = io(wsUrl, {
      transports: ['websocket']
    });
    
    socket.on('connect', () => {
      console.log('[PresenceIndicators] Connected');
    });
    
    socket.on('user-joined', (user: any) => {
      console.log('[PresenceIndicators] User joined:', user);
    });
    
    socket.on('user-left', (user: any) => {
      console.log('[PresenceIndicators] User left:', user);
    });
    
    return {
      socket,
      emitPresence: (data: any) => socket?.emit('presence', data),
      onPresenceUpdate: (callback: (users: any[]) => void) => {
        socket?.on('presence-update', callback);
      }
    };
  } catch (error) {
    console.error('[PresenceIndicators] Error:', error);
    return null;
  }
};

export default initializePresence;

