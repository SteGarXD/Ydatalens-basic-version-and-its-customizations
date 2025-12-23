/**
 * Модуль Secure Embedding
 * Встраивание в защищенные корпоративные порталы с JWT токенами
 */

import React from 'react';
import { SECURE_EMBEDDING_CONFIG } from '../../config';

export interface EmbedToken {
  token: string;
  expiresAt: number;
  dashboardId: string;
  permissions: string[];
}

export interface EmbedConfig {
  dashboardId: string;
  userId?: string;
  permissions?: string[];
  expiresIn?: number; // секунды
}

/**
 * Создать токен для встраивания
 */
export const createEmbedToken = async (config: EmbedConfig): Promise<EmbedToken> => {
  try {
    const response = await fetch('/api/v1/embed/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        expiresIn: config.expiresIn || SECURE_EMBEDDING_CONFIG.tokenExpiry,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create embed token');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating embed token:', error);
    throw error;
  }
};

/**
 * Проверить токен встраивания
 */
export const verifyEmbedToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/v1/embed/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error verifying embed token:', error);
    return false;
  }
};

/**
 * Получить URL для встраивания дашборда
 */
export const getEmbedUrl = (dashboardId: string, token: string, options?: {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}): string => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    token,
    ...(options?.width && { width: options.width.toString() }),
    ...(options?.height && { height: options.height.toString() }),
    ...(options?.theme && { theme: options.theme }),
  });
  
  return `${baseUrl}/embed/dashboard/${dashboardId}?${params.toString()}`;
};

/**
 * Компонент для встраивания дашборда
 */
export const EmbeddedDashboard: React.FC<{
  dashboardId: string;
  token: string;
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}> = ({ dashboardId, token, width = 800, height = 600, theme = 'light' }) => {
  const embedUrl = getEmbedUrl(dashboardId, token, { width, height, theme });
  
  return (
    <iframe
      src={embedUrl}
      width={width}
      height={height}
      frameBorder="0"
      allowFullScreen
      style={{ border: 'none' }}
    />
  );
};

const SecureEmbeddingModule: React.FC = () => {
  return null;
};

export default SecureEmbeddingModule;

