/**
 * Модуль экспорта дашбордов в PowerPoint (PPT)
 * Каждый виджет на отдельном слайде
 */

import React from 'react';

export interface PPTExportOptions {
  title: string;
  includeAllWidgets: boolean;
  widgetIds?: string[];
  template?: 'default' | 'corporate' | 'minimal';
  includeTimestamp: boolean;
}

/**
 * Экспорт дашборда в PPT
 */
export const exportDashboardToPPT = async (
  dashboardId: string,
  options: PPTExportOptions
): Promise<Blob> => {
  try {
    const response = await fetch(`/api/v1/dashboards/${dashboardId}/export/ppt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export dashboard to PPT');
    }
    
    return await response.blob();
  } catch (error) {
    console.error('PPT export error:', error);
    throw error;
  }
};

/**
 * Скачать PPT файл
 */
export const downloadPPT = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Экспорт и скачивание дашборда в PPT
 */
export const exportAndDownloadPPT = async (
  dashboardId: string,
  options: PPTExportOptions
) => {
  const blob = await exportDashboardToPPT(dashboardId, options);
  const timestamp = options.includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
  const filename = `${options.title || 'dashboard'}_${dashboardId}${timestamp}.pptx`;
  downloadPPT(blob, filename);
};

const PPTExportModule: React.FC = () => {
  return null;
};

export default PPTExportModule;

