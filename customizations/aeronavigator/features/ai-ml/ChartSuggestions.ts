/**
 * Chart Suggestions Module
 * Автоматические предложения графиков
 * Анализирует данные и предлагает лучшие типы визуализации
 */

interface ChartSuggestion {
  type: string;
  name: string;
  score: number;
  reason: string;
  fields: string[];
  config?: any;
}

/**
 * Анализ типа данных поля
 */
const analyzeFieldType = (data: any[], field: string): {
  isNumeric: boolean;
  isDate: boolean;
  isCategorical: boolean;
  uniqueValues: number;
  hasNulls: boolean;
} => {
  const values = data.map(row => row[field]).filter(v => v !== null && v !== undefined);
  const uniqueValues = new Set(values).size;
  
  const isNumeric = values.some(v => typeof v === 'number' || (!isNaN(parseFloat(v)) && isFinite(parseFloat(v))));
  const isDate = values.some(v => {
    if (v instanceof Date) return true;
    if (typeof v === 'string') {
      const parsed = new Date(v);
      return !isNaN(parsed.getTime());
    }
    return false;
  });
  const isCategorical = uniqueValues < data.length * 0.5 && uniqueValues < 50;
  const hasNulls = values.length < data.length;
  
  return {
    isNumeric,
    isDate,
    isCategorical,
    uniqueValues,
    hasNulls
  };
};

/**
 * Предложения для одного числового поля
 */
const suggestSingleNumeric = (data: any[], field: string): ChartSuggestion[] => {
  const suggestions: ChartSuggestion[] = [];
  const values = data
    .map(row => {
      const val = row[field];
      return typeof val === 'number' ? val : parseFloat(val);
    })
    .filter(v => !isNaN(v));
  
  if (values.length === 0) return suggestions;
  
  // Гистограмма
  suggestions.push({
    type: 'histogram',
    name: 'Гистограмма',
    score: 0.9,
    reason: 'Идеально для распределения числовых значений',
    fields: [field],
    config: { bins: 20 }
  });
  
  // Box plot
  suggestions.push({
    type: 'box_plot',
    name: 'Диаграмма размаха',
    score: 0.8,
    reason: 'Показывает распределение и выбросы',
    fields: [field]
  });
  
  // Gauge
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min >= 0 && max <= 100) {
    suggestions.push({
      type: 'gauge',
      name: 'Индикатор',
      score: 0.7,
      reason: 'Подходит для процентных значений',
      fields: [field],
      config: { min, max }
    });
  }
  
  return suggestions;
};

/**
 * Предложения для двух полей
 */
const suggestTwoFields = (
  data: any[],
  field1: string,
  field2: string,
  type1: ReturnType<typeof analyzeFieldType>,
  type2: ReturnType<typeof analyzeFieldType>
): ChartSuggestion[] => {
  const suggestions: ChartSuggestion[] = [];
  
  // Числовое + Категориальное
  if (type1.isNumeric && type2.isCategorical) {
    suggestions.push({
      type: 'bar_chart',
      name: 'Столбчатая диаграмма',
      score: 0.95,
      reason: 'Идеально для сравнения числовых значений по категориям',
      fields: [field2, field1],
      config: { x: field2, y: field1 }
    });
    
    suggestions.push({
      type: 'pie_chart',
      name: 'Круговая диаграмма',
      score: type2.uniqueValues <= 10 ? 0.8 : 0.5,
      reason: type2.uniqueValues <= 10 
        ? 'Подходит для небольшого количества категорий'
        : 'Слишком много категорий',
      fields: [field2, field1]
    });
  }
  
  // Категориальное + Числовое (обратный порядок)
  if (type1.isCategorical && type2.isNumeric) {
    suggestions.push({
      type: 'bar_chart',
      name: 'Столбчатая диаграмма',
      score: 0.95,
      reason: 'Идеально для сравнения числовых значений по категориям',
      fields: [field1, field2],
      config: { x: field1, y: field2 }
    });
  }
  
  // Числовое + Числовое
  if (type1.isNumeric && type2.isNumeric) {
    suggestions.push({
      type: 'scatter_chart',
      name: 'Точечная диаграмма',
      score: 0.9,
      reason: 'Идеально для анализа корреляции между двумя числовыми переменными',
      fields: [field1, field2],
      config: { x: field1, y: field2 }
    });
    
    suggestions.push({
      type: 'line_chart',
      name: 'Линейный график',
      score: 0.7,
      reason: 'Подходит для временных рядов или последовательностей',
      fields: [field1, field2]
    });
  }
  
  // Дата + Числовое
  if (type1.isDate && type2.isNumeric) {
    suggestions.push({
      type: 'line_chart',
      name: 'Линейный график',
      score: 0.95,
      reason: 'Идеально для временных рядов',
      fields: [field1, field2],
      config: { x: field1, y: field2 }
    });
    
    suggestions.push({
      type: 'area_chart',
      name: 'График с областями',
      score: 0.85,
      reason: 'Подходит для временных рядов с акцентом на объем',
      fields: [field1, field2]
    });
  }
  
  return suggestions;
};

/**
 * Предложения для трех и более полей
 */
const suggestMultipleFields = (
  data: any[],
  fields: string[],
  fieldTypes: Map<string, ReturnType<typeof analyzeFieldType>>
): ChartSuggestion[] => {
  const suggestions: ChartSuggestion[] = [];
  
  const numericFields = fields.filter(f => fieldTypes.get(f)?.isNumeric);
  const categoricalFields = fields.filter(f => fieldTypes.get(f)?.isCategorical);
  const dateFields = fields.filter(f => fieldTypes.get(f)?.isDate);
  
  // Heatmap для категориальных данных
  if (categoricalFields.length >= 2) {
    suggestions.push({
      type: 'heatmap',
      name: 'Тепловая карта',
      score: 0.8,
      reason: 'Идеально для анализа двух категориальных переменных',
      fields: categoricalFields.slice(0, 2)
    });
  }
  
  // Сводная таблица
  if (fields.length >= 3) {
    suggestions.push({
      type: 'pivot_table',
      name: 'Сводная таблица',
      score: 0.9,
      reason: 'Подходит для многомерного анализа',
      fields
    });
    
    suggestions.push({
      type: 'pivot_table_s2',
      name: 'Сводная таблица S2',
      score: 0.95,
      reason: 'Мощная сводная таблица с расширенными возможностями',
      fields
    });
  }
  
  // Treemap для иерархических данных
  if (categoricalFields.length >= 2 && numericFields.length >= 1) {
    suggestions.push({
      type: 'treemap',
      name: 'Карта дерева',
      score: 0.75,
      reason: 'Подходит для иерархических данных',
      fields: [...categoricalFields.slice(0, 2), numericFields[0]]
    });
  }
  
  // Sunburst
  if (categoricalFields.length >= 2 && numericFields.length >= 1) {
    suggestions.push({
      type: 'sunburst',
      name: 'Солнечная диаграмма',
      score: 0.7,
      reason: 'Подходит для многоуровневых иерархий',
      fields: [...categoricalFields.slice(0, 2), numericFields[0]]
    });
  }
  
  return suggestions;
};

/**
 * Автоматические предложения графиков
 */
export const suggestCharts = async (
  data: any[],
  fields?: string[]
): Promise<{
  suggestions: ChartSuggestion[];
  recommended: string;
}> => {
  if (!data || data.length === 0) {
    return { suggestions: [], recommended: '' };
  }
  
  // Определяем поля для анализа
  const availableFields = fields || Object.keys(data[0] || {});
  if (availableFields.length === 0) {
    return { suggestions: [], recommended: '' };
  }
  
  // Анализируем типы полей
  const fieldTypes = new Map<string, ReturnType<typeof analyzeFieldType>>();
  availableFields.forEach(field => {
    fieldTypes.set(field, analyzeFieldType(data, field));
  });
  
  const allSuggestions: ChartSuggestion[] = [];
  
  // Предложения для одного поля
  if (availableFields.length === 1) {
    const field = availableFields[0];
    const type = fieldTypes.get(field)!;
    
    if (type.isNumeric) {
      allSuggestions.push(...suggestSingleNumeric(data, field));
    } else if (type.isCategorical) {
      allSuggestions.push({
        type: 'pie_chart',
        name: 'Круговая диаграмма',
        score: type.uniqueValues <= 10 ? 0.9 : 0.6,
        reason: type.uniqueValues <= 10 
          ? 'Идеально для категориальных данных'
          : 'Много категорий, но можно использовать',
        fields: [field]
      });
    }
  }
  
  // Предложения для двух полей
  if (availableFields.length === 2) {
    const [field1, field2] = availableFields;
    const type1 = fieldTypes.get(field1)!;
    const type2 = fieldTypes.get(field2)!;
    
    allSuggestions.push(...suggestTwoFields(data, field1, field2, type1, type2));
    allSuggestions.push(...suggestTwoFields(data, field2, field1, type2, type1));
  }
  
  // Предложения для трех и более полей
  if (availableFields.length >= 3) {
    allSuggestions.push(...suggestMultipleFields(data, availableFields, fieldTypes));
  }
  
  // Убираем дубликаты и сортируем по score
  const uniqueSuggestions = allSuggestions.reduce((acc, suggestion) => {
    const key = `${suggestion.type}-${suggestion.fields.join(',')}`;
    const existing = acc.find(s => {
      const existingKey = `${s.type}-${s.fields.join(',')}`;
      return existingKey === key;
    });
    
    if (!existing || suggestion.score > existing.score) {
      return acc.filter(s => {
        const sKey = `${s.type}-${s.fields.join(',')}`;
        return sKey !== key;
      }).concat(suggestion);
    }
    
    return acc;
  }, [] as ChartSuggestion[]);
  
  uniqueSuggestions.sort((a, b) => b.score - a.score);
  
  // Рекомендуемый график - с наивысшим score
  const recommended = uniqueSuggestions.length > 0 ? uniqueSuggestions[0].type : '';
  
  return {
    suggestions: uniqueSuggestions,
    recommended
  };
};

export default suggestCharts;
