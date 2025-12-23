/**
 * Модуль экспорта дашбордов в PDF
 * Поддержка русских шрифтов и настройка формата
 */

import React from 'react';

export interface PDFExportOptions {
  format: 'A4' | 'A3' | 'letter';
  orientation: 'portrait' | 'landscape';
  includeAllWidgets: boolean;
  widgetIds?: string[];
  title?: string;
  includeTimestamp: boolean;
  quality: 'low' | 'medium' | 'high';
}

/**
 * Экспорт дашборда в PDF
 */
export const exportDashboardToPDF = async (
  dashboardId: string,
  options: PDFExportOptions
): Promise<Blob> => {
  try {
    const response = await fetch(`/api/v1/dashboards/${dashboardId}/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export dashboard to PDF');
    }
    
    return await response.blob();
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};

/**
 * Скачать PDF файл
 */
export const downloadPDF = (blob: Blob, filename: string) => {
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
 * Экспорт и скачивание дашборда
 */
export const exportAndDownloadPDF = async (
  dashboardId: string,
  options: PDFExportOptions
) => {
  const blob = await exportDashboardToPDF(dashboardId, options);
  const timestamp = options.includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
  const filename = `${options.title || 'dashboard'}_${dashboardId}${timestamp}.pdf`;
  downloadPDF(blob, filename);
};

const PDFExportModule: React.FC = () => {
  return null;
};

export default PDFExportModule;

