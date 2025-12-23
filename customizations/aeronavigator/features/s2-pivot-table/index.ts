/**
 * S2 Pivot Table Module
 * Интеграция Alibaba S2 Pivot Table в DataLens как виджет
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

/**
 * Инициализация S2 Pivot Table виджета
 * Регистрирует виджет в системе DataLens и галерее виджетов
 */
export const initializeS2PivotTable = async () => {
  if (!AERONAVIGATOR_FEATURES.S2_PIVOT_TABLE) {
    return;
  }

  try {
    // Динамический импорт для уменьшения размера бандла
    const S2PivotTableComponent = await import('./S2PivotTableWidget');
    const { registerS2PivotTableWidget } = await import('./WidgetRegistry');
    
    // Регистрация виджета в галерее виджетов DataLens
    registerS2PivotTableWidget();
    
    // Регистрация виджета в системе DataLens
    // Используем глобальный объект DataLens для регистрации виджетов
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      
      // Регистрируем виджет
      if (!datalens.widgets) {
        datalens.widgets = {};
      }
      
      datalens.widgets['pivot_table_s2'] = {
        type: 'pivot_table_s2',
        name: 'Сводная таблица S2 (Alibaba)',
        displayName: 'Сводная таблица S2',
        category: 'tables',
        icon: 'table',
        description: 'Мощная сводная таблица от Alibaba с drag-drop, условным форматированием и экспортом',
        component: S2PivotTableComponent.default,
        settingsComponent: S2PivotTableComponent.S2PivotTableSettings,
        features: [
          'drag-drop',
          'conditional-formatting',
          'export-excel',
          'sorting',
          'filtering',
          'pivot-operations',
          'drill-down',
          'grand-totals',
          'subtotals',
          'frozen-rows',
          'frozen-columns'
        ],
        defaultConfig: {
          rows: [],
          cols: [],
          values: [],
          aggregations: {},
          showTooltip: true,
          showHeader: true,
          frozenRowCount: 0,
          frozenColCount: 0
        }
      };
      
      // Сохраняем обратно в window
      (window as any).datalens = datalens;
      
      console.log('[AeronavigatorBI] S2 Pivot Table widget registered');
    }
    
    // Также регистрируем в системе виджетов DataLens (если доступна)
    if (typeof window !== 'undefined' && (window as any).registerDataLensWidget) {
      (window as any).registerDataLensWidget({
        type: 'pivot_table_s2',
        name: 'Сводная таблица S2 (Alibaba)',
        category: 'tables',
        icon: 'table',
        component: S2PivotTableComponent.default
      });
    }
    
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing S2 Pivot Table:', error);
  }
};

export default initializeS2PivotTable;

