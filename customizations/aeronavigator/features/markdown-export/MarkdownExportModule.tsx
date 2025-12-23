/**
 * Модуль экспорта данных в Markdown формат
 */

import React from 'react';

export interface MarkdownExportOptions {
  includeMetadata: boolean;
  includeCharts: boolean;
  chartFormat: 'table' | 'code' | 'image';
  includeData: boolean;
}

/**
 * Экспорт дашборда в Markdown
 */
export const exportDashboardToMarkdown = async (
  dashboardId: string,
  options: MarkdownExportOptions
): Promise<string> => {
  try {
    const response = await fetch(`/api/v1/dashboards/${dashboardId}/export/markdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export dashboard to Markdown');
    }
    
    return await response.text();
  } catch (error) {
    console.error('Markdown export error:', error);
    throw error;
  }
};

/**
 * Скачать Markdown файл
 */
export const downloadMarkdown = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/markdown' });
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
 * Экспорт и скачивание дашборда в Markdown
 */
export const exportAndDownloadMarkdown = async (
  dashboardId: string,
  options: MarkdownExportOptions
) => {
  const content = await exportDashboardToMarkdown(dashboardId, options);
  const filename = `dashboard_${dashboardId}_${new Date().toISOString().split('T')[0]}.md`;
  downloadMarkdown(content, filename);
};

const MarkdownExportModule: React.FC = () => {
  return null;
};

export default MarkdownExportModule;

