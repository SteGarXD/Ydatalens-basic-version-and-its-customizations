/**
 * Auto Dashboards Module
 * Автоматическое создание дашбордов на основе данных
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layout: 'grid' | 'flow' | 'auto';
}

export interface WidgetConfig {
  type: string;
  title: string;
  dataSource: string;
  fields: string[];
  chartType?: string;
  position?: { x: number; y: number; w: number; h: number };
}

/**
 * Автоматическое создание дашборда на основе данных
 */
export const generateDashboard = async (
  data: any[],
  options?: {
    name?: string;
    maxWidgets?: number;
    preferredChartTypes?: string[];
  }
): Promise<DashboardConfig> => {
  if (!AERONAVIGATOR_FEATURES.AUTO_DASHBOARDS) {
    throw new Error('Auto dashboards are disabled');
  }

  const name = options?.name || `Auto Dashboard ${new Date().toISOString()}`;
  const maxWidgets = options?.maxWidgets || 12;
  const widgets: WidgetConfig[] = [];

  if (data.length === 0) {
    return {
      id: `dashboard-${Date.now()}`,
      name,
      widgets: [],
      layout: 'grid',
    };
  }

  // Анализ структуры данных
  const fields = Object.keys(data[0]);
  const numericFields = fields.filter(field => {
    const sample = data[0][field];
    return typeof sample === 'number';
  });
  const categoricalFields = fields.filter(field => {
    const sample = data[0][field];
    return typeof sample === 'string' || typeof sample === 'boolean';
  });
  const dateFields = fields.filter(field => {
    const sample = data[0][field];
    return sample instanceof Date || (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample));
  });

  // Генерация виджетов на основе данных
  let widgetIndex = 0;

  // 1. Сводная статистика (если есть числовые поля)
  if (numericFields.length > 0 && widgetIndex < maxWidgets) {
    widgets.push({
      type: 'stat',
      title: 'Сводная статистика',
      dataSource: 'current',
      fields: numericFields.slice(0, 4),
      position: { x: 0, y: 0, w: 12, h: 2 },
    });
    widgetIndex++;
  }

  // 2. Временные ряды (если есть дата и числовые поля)
  if (dateFields.length > 0 && numericFields.length > 0 && widgetIndex < maxWidgets) {
    widgets.push({
      type: 'chart',
      title: 'Временной ряд',
      dataSource: 'current',
      fields: [dateFields[0], numericFields[0]],
      chartType: 'line',
      position: { x: 0, y: 2, w: 8, h: 4 },
    });
    widgetIndex++;
  }

  // 3. Распределение (для числовых полей)
  if (numericFields.length > 0 && widgetIndex < maxWidgets) {
    widgets.push({
      type: 'chart',
      title: 'Распределение',
      dataSource: 'current',
      fields: [numericFields[0]],
      chartType: 'histogram',
      position: { x: 8, y: 2, w: 4, h: 4 },
    });
    widgetIndex++;
  }

  // 4. Категориальные данные (pie chart)
  if (categoricalFields.length > 0 && widgetIndex < maxWidgets) {
    widgets.push({
      type: 'chart',
      title: 'Распределение по категориям',
      dataSource: 'current',
      fields: [categoricalFields[0]],
      chartType: 'pie',
      position: { x: 0, y: 6, w: 6, h: 4 },
    });
    widgetIndex++;
  }

  // 5. Корреляция (если есть несколько числовых полей)
  if (numericFields.length >= 2 && widgetIndex < maxWidgets) {
    widgets.push({
      type: 'chart',
      title: 'Корреляция',
      dataSource: 'current',
      fields: numericFields.slice(0, 2),
      chartType: 'scatter',
      position: { x: 6, y: 6, w: 6, h: 4 },
    });
    widgetIndex++;
  }

  // 6. Таблица данных
  if (widgetIndex < maxWidgets) {
    widgets.push({
      type: 'table',
      title: 'Данные',
      dataSource: 'current',
      fields: fields.slice(0, 10),
      position: { x: 0, y: 10, w: 12, h: 6 },
    });
    widgetIndex++;
  }

  return {
    id: `dashboard-${Date.now()}`,
    name,
    widgets,
    layout: 'grid',
  };
};

/**
 * Улучшение существующего дашборда
 */
export const enhanceDashboard = async (
  dashboard: DashboardConfig,
  data: any[]
): Promise<DashboardConfig> => {
  if (!AERONAVIGATOR_FEATURES.AUTO_DASHBOARDS) {
    return dashboard;
  }

  // Анализ данных и предложение улучшений
  const suggestions: WidgetConfig[] = [];

  // Проверка на аномалии
  try {
    const { detectAnomalies } = await import('../ai-ml/AnomalyDetection');
    const anomalyResult = await detectAnomalies(data, { method: 'auto' });
    
    if (anomalyResult.anomalies.length > 0) {
      suggestions.push({
        type: 'chart',
        title: 'Аномалии в данных',
        dataSource: 'current',
        fields: Object.keys(data[0] || {}),
        chartType: 'scatter',
      });
    }
  } catch (error) {
    console.warn('[AutoDashboards] Anomaly detection failed:', error);
  }

  return {
    ...dashboard,
    widgets: [...dashboard.widgets, ...suggestions],
  };
};

/**
 * Инициализация Auto Dashboards
 */
export const initializeAutoDashboards = async () => {
  if (!AERONAVIGATOR_FEATURES.AUTO_DASHBOARDS) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.autoDashboards) {
        datalens.autoDashboards = {
          generate: generateDashboard,
          enhance: enhanceDashboard,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Auto Dashboards initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Auto Dashboards:', error);
  }
};

export default initializeAutoDashboards;

