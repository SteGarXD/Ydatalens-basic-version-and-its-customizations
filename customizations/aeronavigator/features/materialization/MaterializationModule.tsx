/**
 * Модуль материализации данных
 * Режим предварительной загрузки данных в ClickHouse
 */

import React from 'react';
import { MATERIALIZATION_CONFIG } from '../../config';

export interface MaterializationConfig {
  datasetId: string;
  tableName: string;
  interval: number; // секунды
  query: string;
  enabled: boolean;
}

/**
 * Создать материализованную таблицу
 */
export const createMaterializedTable = async (
  config: MaterializationConfig
): Promise<{ tableName: string; rowCount: number }> => {
  try {
    const response = await fetch('/api/v1/materialization/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to create materialized table');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating materialized table:', error);
    throw error;
  }
};

/**
 * Обновить материализованные данные
 */
export const refreshMaterializedData = async (
  tableName: string
): Promise<void> => {
  try {
    const response = await fetch(`/api/v1/materialization/${tableName}/refresh`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to refresh materialized data');
    }
  } catch (error) {
    console.error('Error refreshing materialized data:', error);
    throw error;
  }
};

/**
 * Получить статус материализации
 */
export const getMaterializationStatus = async (
  tableName: string
): Promise<{
  lastUpdate: string;
  nextUpdate: string;
  rowCount: number;
  status: 'active' | 'paused' | 'error';
}> => {
  try {
    const response = await fetch(`/api/v1/materialization/${tableName}/status`);
    if (!response.ok) {
      throw new Error('Failed to get materialization status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting materialization status:', error);
    throw error;
  }
};

const MaterializationModule: React.FC = () => {
  return null;
};

export default MaterializationModule;

