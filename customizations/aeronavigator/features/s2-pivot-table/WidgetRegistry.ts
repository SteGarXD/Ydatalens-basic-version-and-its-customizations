/**
 * Widget Registry для S2 Pivot Table
 * Регистрация виджета в галерее виджетов DataLens
 */

/**
 * Регистрация S2 Pivot Table в галерее виджетов DataLens
 * Этот код интегрируется с системой виджетов DataLens
 */
export const registerS2PivotTableWidget = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // Получаем или создаем реестр виджетов DataLens
  const datalens = (window as any).datalens || {};
  
  if (!datalens.widgetRegistry) {
    datalens.widgetRegistry = [];
  }

  // Регистрируем S2 Pivot Table виджет
  const widgetDefinition = {
    id: 'pivot_table_s2',
    type: 'pivot_table_s2',
    name: 'Сводная таблица S2',
    displayName: 'Сводная таблица S2 (Alibaba)',
    category: 'tables',
    icon: 'table',
    description: 'Мощная сводная таблица от Alibaba AntV с drag-drop, условным форматированием, экспортом и drill-down',
    tags: ['pivot', 'table', 's2', 'alibaba', 'antv', 'advanced'],
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
      'frozen-columns',
      'cell-formatting',
      'data-grouping'
    ],
    // Настройки по умолчанию
    defaultConfig: {
      rows: [],
      cols: [],
      values: [],
      aggregations: {},
      showTooltip: true,
      showHeader: true,
      frozenRowCount: 0,
      frozenColCount: 0,
      showSeriesNumber: true,
      showDefaultHeaderActionIcon: true
    },
    // Минимальные требования к данным
    dataRequirements: {
      minRows: 1,
      minColumns: 1,
      requiredFields: []
    },
    // Поддерживаемые типы данных
    supportedDataTypes: ['number', 'string', 'date', 'datetime'],
    // Примеры использования
    examples: [
      {
        name: 'Анализ продаж',
        description: 'Сводная таблица продаж по регионам и периодам',
        config: {
          rows: ['region', 'product'],
          cols: ['month', 'quarter'],
          values: ['sales', 'revenue']
        }
      },
      {
        name: 'Анализ рейсов',
        description: 'Сводная таблица рейсов по маршрутам и датам',
        config: {
          rows: ['route', 'aircraft'],
          cols: ['date', 'weekday'],
          values: ['passengers', 'revenue']
        }
      }
    ]
  };

  // Проверяем, не зарегистрирован ли уже виджет
  const existingIndex = datalens.widgetRegistry.findIndex(
    (w: any) => w.id === 'pivot_table_s2'
  );

  if (existingIndex >= 0) {
    datalens.widgetRegistry[existingIndex] = widgetDefinition;
  } else {
    datalens.widgetRegistry.push(widgetDefinition);
  }

  // Сохраняем обратно в window
  (window as any).datalens = datalens;

  // Также регистрируем через стандартный API DataLens (если доступен)
  if ((window as any).registerDataLensWidget) {
    (window as any).registerDataLensWidget(widgetDefinition);
  }

  // Вызываем событие регистрации виджета
  if (typeof document !== 'undefined') {
    const event = new CustomEvent('datalens:widget-registered', {
      detail: widgetDefinition
    });
    document.dispatchEvent(event);
  }

  console.log('[AeronavigatorBI] S2 Pivot Table widget registered in gallery');
};

export default registerS2PivotTableWidget;

