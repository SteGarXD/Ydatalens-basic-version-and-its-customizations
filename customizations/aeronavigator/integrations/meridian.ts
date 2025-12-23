/**
 * Интеграция с Meridian
 * Синхронизация пользователей и RLS
 */

import { MERIDIAN_INTEGRATION_CONFIG } from '../config';

export interface MeridianUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface MeridianRLSConfig {
  userId: string;
  filters: Record<string, any>;
}

/**
 * Синхронизировать пользователей из Meridian
 */
export const syncUsersFromMeridian = async (): Promise<MeridianUser[]> => {
  try {
    const response = await fetch(`${MERIDIAN_INTEGRATION_CONFIG.apiUrl}/api/users`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERIDIAN_API_TOKEN || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to sync users from Meridian');
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error syncing users from Meridian:', error);
    throw error;
  }
};

/**
 * Получить RLS конфигурацию для пользователя
 */
export const getRLSConfigForUser = async (userId: string): Promise<MeridianRLSConfig> => {
  try {
    const response = await fetch(
      `${MERIDIAN_INTEGRATION_CONFIG.apiUrl}/api/rls/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERIDIAN_API_TOKEN || ''}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get RLS config');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting RLS config:', error);
    throw error;
  }
};

/**
 * Применить RLS фильтры к запросу
 */
export const applyRLSFilters = (
  query: string,
  rlsConfig: MeridianRLSConfig
): string => {
  let modifiedQuery = query;

  Object.entries(rlsConfig.filters).forEach(([field, value]) => {
    // Добавить WHERE или AND условие
    if (modifiedQuery.toUpperCase().includes('WHERE')) {
      modifiedQuery += ` AND ${field} = '${value}'`;
    } else {
      modifiedQuery += ` WHERE ${field} = '${value}'`;
    }
  });

  return modifiedQuery;
};

export default {
  syncUsersFromMeridian,
  getRLSConfigForUser,
  applyRLSFilters,
};

