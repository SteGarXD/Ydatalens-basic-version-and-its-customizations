/**
 * Модуль версионирования дашбордов
 * Автоматическое сохранение версий и история изменений
 */

import React from 'react';
import { VERSIONING_CONFIG } from '../../config';

export interface DashboardVersion {
  id: string;
  dashboardId: string;
  version: number;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  data: any; // Содержимое дашборда
  isAutoVersion: boolean;
}

export interface VersioningOptions {
  autoVersion: boolean;
  maxVersions: number;
  comment?: string;
}

/**
 * Создать версию дашборда
 */
export const createVersion = async (
  dashboardId: string,
  options: VersioningOptions = {
    autoVersion: VERSIONING_CONFIG.autoVersion,
    maxVersions: VERSIONING_CONFIG.maxVersions,
  }
): Promise<DashboardVersion> => {
  try {
    const response = await fetch(`/api/v1/dashboards/${dashboardId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create version');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating version:', error);
    throw error;
  }
};

/**
 * Получить список версий дашборда
 */
export const getVersions = async (dashboardId: string): Promise<DashboardVersion[]> => {
  try {
    const response = await fetch(`/api/v1/dashboards/${dashboardId}/versions`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get versions');
    }
    
    const data = await response.json();
    return data.versions || [];
  } catch (error) {
    console.error('Error getting versions:', error);
    throw error;
  }
};

/**
 * Получить конкретную версию
 */
export const getVersion = async (
  dashboardId: string,
  versionId: string
): Promise<DashboardVersion> => {
  try {
    const response = await fetch(`/api/v1/dashboards/${dashboardId}/versions/${versionId}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get version');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting version:', error);
    throw error;
  }
};

/**
 * Восстановить дашборд из версии
 */
export const restoreVersion = async (
  dashboardId: string,
  versionId: string
): Promise<void> => {
  try {
    const response = await fetch(
      `/api/v1/dashboards/${dashboardId}/versions/${versionId}/restore`,
      {
        method: 'POST',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to restore version');
    }
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
};

/**
 * Сравнить две версии
 */
export const compareVersions = async (
  dashboardId: string,
  versionId1: string,
  versionId2: string
): Promise<{ differences: any[] }> => {
  try {
    const response = await fetch(
      `/api/v1/dashboards/${dashboardId}/versions/compare`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId1, versionId2 }),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to compare versions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error comparing versions:', error);
    throw error;
  }
};

const VersioningModule: React.FC = () => {
  return null;
};

export default VersioningModule;

