/**
 * Natural Language Query Module
 * Запросы на естественном языке
 * Использует паттерны и ключевые слова (бесплатно, безопасно для РФ)
 */

interface QueryResult {
  sql: string;
  chartType: string;
  fields: string[];
  filters?: Record<string, any>;
  aggregations?: Record<string, string>;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

/**
 * Словарь ключевых слов для русского языка
 */
const KEYWORDS = {
  // Агрегации
  aggregations: {
    sum: ['сумма', 'суммировать', 'итого', 'всего'],
    avg: ['среднее', 'средний', 'средняя', 'в среднем'],
    count: ['количество', 'число', 'сколько', 'посчитать'],
    min: ['минимум', 'минимальный', 'наименьший'],
    max: ['максимум', 'максимальный', 'наибольший']
  },
  // Временные периоды
  time: {
    today: ['сегодня', 'текущий день'],
    yesterday: ['вчера'],
    week: ['неделя', 'неделю', 'недели'],
    month: ['месяц', 'месяца', 'месяцу'],
    year: ['год', 'года', 'году'],
    last: ['последний', 'последняя', 'последнее', 'за последний'],
    current: ['текущий', 'текущая', 'текущее']
  },
  // Операторы сравнения
  operators: {
    greater: ['больше', 'выше', 'превышает'],
    less: ['меньше', 'ниже'],
    equal: ['равно', 'равен', 'равна', 'равны'],
    contains: ['содержит', 'включает', 'есть']
  },
  // Типы графиков
  chartTypes: {
    line: ['линия', 'линейный', 'график', 'тренд'],
    bar: ['столбчатая', 'столбец', 'столбцы', 'гистограмма'],
    pie: ['круговая', 'пирог', 'доля'],
    table: ['таблица', 'таблицу', 'список']
  },
  // Сортировка
  sort: {
    asc: ['по возрастанию', 'возрастание', 'от меньшего'],
    desc: ['по убыванию', 'убывание', 'от большего', 'сначала больше']
  }
};

/**
 * Извлечение агрегации из запроса
 */
const extractAggregation = (query: string): { field?: string; func: string } => {
  const lowerQuery = query.toLowerCase();
  
  for (const [func, keywords] of Object.entries(KEYWORDS.aggregations)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        // Пытаемся найти поле после ключевого слова
        const index = lowerQuery.indexOf(keyword);
        const afterKeyword = query.slice(index + keyword.length).trim();
        const words = afterKeyword.split(/\s+/);
        
        return {
          func,
          field: words[0] || undefined
        };
      }
    }
  }
  
  return { func: 'count' };
};

/**
 * Извлечение временного фильтра
 */
const extractTimeFilter = (query: string): { field?: string; value?: string } | null => {
  const lowerQuery = query.toLowerCase();
  
  for (const [period, keywords] of Object.entries(KEYWORDS.time)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        // Ищем поле даты
        const datePattern = /(дата|время|день|месяц|год|date|time)/i;
        const dateMatch = query.match(datePattern);
        
        return {
          field: dateMatch ? dateMatch[0] : 'date',
          value: period
        };
      }
    }
  }
  
  return null;
};

/**
 * Извлечение полей из запроса
 */
const extractFields = (query: string, availableFields: string[]): string[] => {
  const foundFields: string[] = [];
  const lowerQuery = query.toLowerCase();
  
  availableFields.forEach(field => {
    if (lowerQuery.includes(field.toLowerCase())) {
      foundFields.push(field);
    }
  });
  
  // Если поля не найдены, возвращаем первые доступные
  if (foundFields.length === 0 && availableFields.length > 0) {
    return availableFields.slice(0, Math.min(3, availableFields.length));
  }
  
  return foundFields;
};

/**
 * Определение типа графика
 */
const detectChartType = (query: string, fields: string[]): string => {
  const lowerQuery = query.toLowerCase();
  
  for (const [type, keywords] of Object.entries(KEYWORDS.chartTypes)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return type === 'line' ? 'line_chart' :
               type === 'bar' ? 'bar_chart' :
               type === 'pie' ? 'pie_chart' :
               'table';
      }
    }
  }
  
  // Автоматическое определение по количеству полей
  if (fields.length === 1) {
    return 'bar_chart';
  } else if (fields.length === 2) {
    return 'line_chart';
  } else {
    return 'table';
  }
};

/**
 * Генерация SQL запроса
 */
const generateSQL = (
  table: string,
  fields: string[],
  aggregations?: Record<string, string>,
  filters?: Record<string, any>,
  orderBy?: { field: string; direction: 'asc' | 'desc' },
  limit?: number
): string => {
  let sql = 'SELECT ';
  
  // SELECT часть
  if (aggregations && Object.keys(aggregations).length > 0) {
    const aggParts = Object.entries(aggregations).map(([field, func]) => {
      return `${func.toUpperCase()}(${field}) AS ${field}_${func}`;
    });
    sql += aggParts.join(', ');
  } else {
    sql += fields.join(', ');
  }
  
  sql += ` FROM ${table}`;
  
  // WHERE часть
  if (filters && Object.keys(filters).length > 0) {
    sql += ' WHERE ';
    const conditions = Object.entries(filters).map(([field, value]) => {
      if (typeof value === 'string') {
        return `${field} = '${value}'`;
      } else if (Array.isArray(value)) {
        return `${field} IN (${value.map(v => `'${v}'`).join(', ')})`;
      } else {
        return `${field} = ${value}`;
      }
    });
    sql += conditions.join(' AND ');
  }
  
  // GROUP BY (если есть агрегации)
  if (aggregations && Object.keys(aggregations).length > 0) {
    const groupFields = fields.filter(f => !aggregations[f]);
    if (groupFields.length > 0) {
      sql += ` GROUP BY ${groupFields.join(', ')}`;
    }
  }
  
  // ORDER BY
  if (orderBy) {
    sql += ` ORDER BY ${orderBy.field} ${orderBy.direction.toUpperCase()}`;
  }
  
  // LIMIT
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  
  return sql;
};

/**
 * Обработка запроса на естественном языке
 */
export const processNaturalLanguageQuery = async (
  query: string,
  options?: {
    availableFields?: string[];
    tableName?: string;
  }
): Promise<QueryResult> => {
  if (!query || query.trim().length === 0) {
    return {
      sql: '',
      chartType: 'table',
      fields: []
    };
  }
  
  const availableFields = options?.availableFields || [];
  const tableName = options?.tableName || 'data';
  
  // Извлекаем информацию из запроса
  const aggregation = extractAggregation(query);
  const timeFilter = extractTimeFilter(query);
  const fields = extractFields(query, availableFields);
  const chartType = detectChartType(query, fields);
  
  // Формируем агрегации
  const aggregations: Record<string, string> = {};
  if (aggregation.func !== 'count' && aggregation.field) {
    aggregations[aggregation.field] = aggregation.func;
  }
  
  // Формируем фильтры
  const filters: Record<string, any> = {};
  if (timeFilter) {
    // Упрощенная обработка временных фильтров
    if (timeFilter.value === 'today') {
      filters[timeFilter.field || 'date'] = 'CURRENT_DATE()';
    } else if (timeFilter.value === 'last') {
      // За последний период
      filters[timeFilter.field || 'date'] = '>= DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)';
    }
  }
  
  // Определяем сортировку
  let orderBy: { field: string; direction: 'asc' | 'desc' } | undefined;
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('по убыванию') || lowerQuery.includes('от большего')) {
    orderBy = {
      field: fields[0] || availableFields[0] || 'id',
      direction: 'desc'
    };
  } else if (lowerQuery.includes('по возрастанию') || lowerQuery.includes('от меньшего')) {
    orderBy = {
      field: fields[0] || availableFields[0] || 'id',
      direction: 'asc'
    };
  }
  
  // Генерируем SQL
  const sql = generateSQL(
    tableName,
    fields.length > 0 ? fields : availableFields.slice(0, 3),
    Object.keys(aggregations).length > 0 ? aggregations : undefined,
    Object.keys(filters).length > 0 ? filters : undefined,
    orderBy,
    100 // Лимит по умолчанию
  );
  
  return {
    sql,
    chartType,
    fields: fields.length > 0 ? fields : availableFields.slice(0, 3),
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    aggregations: Object.keys(aggregations).length > 0 ? aggregations : undefined,
    orderBy
  };
};

export default processNaturalLanguageQuery;
