/**
 * Auto Insights Module
 * Автоматическое обнаружение инсайтов в данных
 * Использует статистические методы (бесплатно, безопасно для РФ)
 */

interface Insight {
  type: 'trend' | 'anomaly' | 'correlation' | 'outlier' | 'pattern';
  title: string;
  description: string;
  field: string;
  value?: any;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
}

interface Trend {
  field: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  change: number;
  period: string;
}

/**
 * Вычисление статистических метрик
 */
const calculateStats = (values: number[]): {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
} => {
  if (values.length === 0) {
    return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, q1: 0, q3: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    q1: sorted[q1Index],
    q3: sorted[q3Index]
  };
};

/**
 * Обнаружение трендов
 */
const detectTrends = (data: any[], field: string): Trend[] => {
  const trends: Trend[] = [];
  
  if (data.length < 2) return trends;
  
  // Извлекаем числовые значения поля
  const values = data
    .map(row => {
      const val = row[field];
      return typeof val === 'number' ? val : parseFloat(val);
    })
    .filter(v => !isNaN(v));
  
  if (values.length < 2) return trends;
  
  // Разделяем на две половины для сравнения
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);
  
  const firstMean = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondMean = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
  
  const change = ((secondMean - firstMean) / firstMean) * 100;
  
  if (Math.abs(change) > 5) {
    trends.push({
      field,
      direction: change > 0 ? 'increasing' : 'decreasing',
      change: Math.abs(change),
      period: 'recent'
    });
  } else {
    trends.push({
      field,
      direction: 'stable',
      change: Math.abs(change),
      period: 'recent'
    });
  }
  
  return trends;
};

/**
 * Обнаружение корреляций
 */
const detectCorrelations = (data: any[], numericFields: string[]): Insight[] => {
  const insights: Insight[] = [];
  
  if (numericFields.length < 2 || data.length < 10) return insights;
  
  // Вычисляем корреляции между парами полей
  for (let i = 0; i < numericFields.length; i++) {
    for (let j = i + 1; j < numericFields.length; j++) {
      const field1 = numericFields[i];
      const field2 = numericFields[j];
      
      const values1 = data.map(row => {
        const val = row[field1];
        return typeof val === 'number' ? val : parseFloat(val);
      }).filter(v => !isNaN(v));
      
      const values2 = data.map(row => {
        const val = row[field2];
        return typeof val === 'number' ? val : parseFloat(val);
      }).filter(v => !isNaN(v));
      
      if (values1.length !== values2.length || values1.length < 10) continue;
      
      // Вычисляем корреляцию Пирсона
      const mean1 = values1.reduce((sum, v) => sum + v, 0) / values1.length;
      const mean2 = values2.reduce((sum, v) => sum + v, 0) / values2.length;
      
      let numerator = 0;
      let denom1 = 0;
      let denom2 = 0;
      
      for (let k = 0; k < values1.length; k++) {
        const diff1 = values1[k] - mean1;
        const diff2 = values2[k] - mean2;
        numerator += diff1 * diff2;
        denom1 += diff1 * diff1;
        denom2 += diff2 * diff2;
      }
      
      const correlation = numerator / Math.sqrt(denom1 * denom2);
      
      if (Math.abs(correlation) > 0.7) {
        insights.push({
          type: 'correlation',
          title: `Сильная корреляция между ${field1} и ${field2}`,
          description: `Корреляция: ${correlation.toFixed(2)}. ${correlation > 0 ? 'Прямая' : 'Обратная'} связь.`,
          field: `${field1} ↔ ${field2}`,
          value: correlation,
          confidence: Math.abs(correlation),
          severity: Math.abs(correlation) > 0.9 ? 'high' : 'medium'
        });
      }
    }
  }
  
  return insights;
};

/**
 * Обнаружение выбросов
 */
const detectOutliers = (data: any[], field: string): Insight[] => {
  const insights: Insight[] = [];
  
  const values = data
    .map(row => {
      const val = row[field];
      return typeof val === 'number' ? val : parseFloat(val);
    })
    .filter(v => !isNaN(v));
  
  if (values.length < 10) return insights;
  
  const stats = calculateStats(values);
  const iqr = stats.q3 - stats.q1;
  const lowerBound = stats.q1 - 1.5 * iqr;
  const upperBound = stats.q3 + 1.5 * iqr;
  
  const outliers = data.filter((row, index) => {
    const val = typeof row[field] === 'number' ? row[field] : parseFloat(row[field]);
    return !isNaN(val) && (val < lowerBound || val > upperBound);
  });
  
  if (outliers.length > 0) {
    insights.push({
      type: 'outlier',
      title: `Обнаружено ${outliers.length} выбросов в поле ${field}`,
      description: `Выбросы выходят за пределы [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`,
      field,
      value: outliers.length,
      confidence: Math.min(outliers.length / data.length, 1),
      severity: outliers.length / data.length > 0.1 ? 'high' : 'medium'
    });
  }
  
  return insights;
};

/**
 * Генерация автоматических инсайтов
 */
export const generateAutoInsights = async (data: any[]): Promise<{
  insights: Insight[];
  trends: Trend[];
  anomalies: Insight[];
}> => {
  if (!data || data.length === 0) {
    return { insights: [], trends: [], anomalies: [] };
  }
  
  const insights: Insight[] = [];
  const trends: Trend[] = [];
  const anomalies: Insight[] = [];
  
  // Получаем все поля
  const fields = Object.keys(data[0] || {});
  
  // Определяем числовые поля
  const numericFields = fields.filter(field => {
    const sample = data.slice(0, Math.min(10, data.length));
    return sample.some(row => {
      const val = row[field];
      return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(parseFloat(val)));
    });
  });
  
  // Обнаружение трендов
  for (const field of numericFields) {
    const fieldTrends = detectTrends(data, field);
    trends.push(...fieldTrends);
    
    // Добавляем тренды как инсайты
    fieldTrends.forEach(trend => {
      if (trend.direction !== 'stable') {
        insights.push({
          type: 'trend',
          title: `${trend.direction === 'increasing' ? 'Рост' : 'Снижение'} в поле ${field}`,
          description: `Изменение на ${trend.change.toFixed(2)}%`,
          field,
          value: trend.change,
          confidence: Math.min(Math.abs(trend.change) / 100, 1),
          severity: Math.abs(trend.change) > 20 ? 'high' : Math.abs(trend.change) > 10 ? 'medium' : 'low'
        });
      }
    });
  }
  
  // Обнаружение корреляций
  if (numericFields.length >= 2) {
    const correlations = detectCorrelations(data, numericFields);
    insights.push(...correlations);
  }
  
  // Обнаружение выбросов
  for (const field of numericFields) {
    const outliers = detectOutliers(data, field);
    anomalies.push(...outliers);
    insights.push(...outliers);
  }
  
  // Обнаружение паттернов (например, сезонность)
  if (data.length >= 12) {
    for (const field of numericFields) {
      const values = data
        .map(row => {
          const val = row[field];
          return typeof val === 'number' ? val : parseFloat(val);
        })
        .filter(v => !isNaN(v));
      
      if (values.length >= 12) {
        // Простая проверка на сезонность (периодичность)
        const period = 12; // Предполагаем месячную периодичность
        let hasPattern = false;
        
        for (let i = period; i < values.length; i++) {
          const current = values[i];
          const previous = values[i - period];
          if (previous && Math.abs((current - previous) / previous) < 0.2) {
            hasPattern = true;
            break;
          }
        }
        
        if (hasPattern) {
          insights.push({
            type: 'pattern',
            title: `Обнаружен паттерн в поле ${field}`,
            description: 'Возможна сезонность или периодичность',
            field,
            confidence: 0.7,
            severity: 'medium'
          });
        }
      }
    }
  }
  
  return {
    insights: insights.sort((a, b) => b.confidence - a.confidence),
    trends,
    anomalies: anomalies.sort((a, b) => b.confidence - a.confidence)
  };
};

export default generateAutoInsights;
