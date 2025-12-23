/**
 * Модуль комментариев
 * Комментарии в текстовых блоках и виджетах
 */

import React from 'react';

export interface Comment {
  id: string;
  targetId: string;
  targetType: 'text' | 'widget' | 'dashboard';
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  replies?: Comment[];
  resolved?: boolean;
}

/**
 * Создать комментарий
 */
export const createComment = async (comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> => {
  try {
    const response = await fetch('/api/v1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });

    if (!response.ok) {
      throw new Error('Failed to create comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

/**
 * Получить комментарии для объекта
 */
export const getComments = async (
  targetId: string,
  targetType: Comment['targetType']
): Promise<Comment[]> => {
  try {
    const response = await fetch(
      `/api/v1/comments?targetId=${targetId}&targetType=${targetType}`
    );
    if (!response.ok) {
      throw new Error('Failed to get comments');
    }

    const data = await response.json();
    return data.comments || [];
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

/**
 * Ответить на комментарий
 */
export const replyToComment = async (
  commentId: string,
  reply: Omit<Comment, 'id' | 'createdAt' | 'targetId' | 'targetType'>
): Promise<Comment> => {
  try {
    const response = await fetch(`/api/v1/comments/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reply),
    });

    if (!response.ok) {
      throw new Error('Failed to reply to comment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error replying to comment:', error);
    throw error;
  }
};

/**
 * Пометить комментарий как решенный
 */
export const resolveComment = async (commentId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/v1/comments/${commentId}/resolve`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to resolve comment');
    }
  } catch (error) {
    console.error('Error resolving comment:', error);
    throw error;
  }
};

const CommentsModule: React.FC = () => {
  return null;
};

export default CommentsModule;

