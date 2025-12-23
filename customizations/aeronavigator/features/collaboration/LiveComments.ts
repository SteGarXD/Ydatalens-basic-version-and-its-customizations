/**
 * Live Comments Module
 * Комментарии в реальном времени
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeLiveComments = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8080';
    socket = io(wsUrl, {
      transports: ['websocket']
    });
    
    return {
      socket,
      addComment: (comment: any) => socket?.emit('comment-add', comment),
      updateComment: (comment: any) => socket?.emit('comment-update', comment),
      deleteComment: (id: string) => socket?.emit('comment-delete', id),
      onCommentAdded: (callback: (comment: any) => void) => {
        socket?.on('comment-added', callback);
      },
      onCommentUpdated: (callback: (comment: any) => void) => {
        socket?.on('comment-updated', callback);
      },
      onCommentDeleted: (callback: (id: string) => void) => {
        socket?.on('comment-deleted', callback);
      }
    };
  } catch (error) {
    console.error('[LiveComments] Error:', error);
    return null;
  }
};

export default initializeLiveComments;

