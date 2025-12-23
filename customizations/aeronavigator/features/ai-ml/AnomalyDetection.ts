/**
 * Anomaly Detection Module
 * Обнаружение аномалий в данных
 * Использует статистические методы (бесплатно, безопасно для РФ)
 */

interface Anomaly {
  index: number;
  field: string;
  value: any;
  expectedValue?: number;
  deviation: number;
  confidence: number;
  type: 'statistical' | 'isolation' | 'zscore';
}

/**
 * Z-Score метод обнаружения аномалий
 */
const detectZScoreAnomalies = (data: any[], field: string, threshold: number = 3): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  const values = data
    .map((row, index) => ({
      index,
      value: typeof row[field] === 'number' ? row[field] : parseFloat(row[field])
    }))
    .filter(item => !isNaN(item.value));
  
  if (values.length < 10) return anomalies;
  
  const mean = values.reduce((sum, item) => sum + item.value, 0) / values.length;
  const variance = values.reduce((sum, item) => sum + Math.pow(item.value - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return anomalies;
  
  values.forEach(({ index, value }) => {
    const zScore = Math.abs((value - mean) / stdDev);
    
    if (zScore > threshold) {
      anomalies.push({
        index,
        field,
        value,
        expectedValue: mean,
        deviation: zScore,
        confidence: Math.min(zScore / threshold, 1),
        type: 'zscore'
      });
    }
  });
  
  return anomalies;
};

/**
 * IQR (Interquartile Range) метод
 */
const detectIQRAnomalies = (data: any[], field: string): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  const values = data
    .map((row, index) => ({
      index,
      value: typeof row[field] === 'number' ? row[field] : parseFloat(row[field])
    }))
    .filter(item => !isNaN(item.value))
    .sort((a, b) => a.value - b.value);
  
  if (values.length < 10) return anomalies;
  
  const q1Index = Math.floor(values.length * 0.25);
  const q3Index = Math.floor(values.length * 0.75);
  const q1 = values[q1Index].value;
  const q3 = values[q3Index].value;
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  values.forEach(({ index, value }) => {
    if (value < lowerBound || value > upperBound) {
      const expectedValue = (q1 + q3) / 2;
      const deviation = Math.abs(value - expectedValue) / iqr;
      
      anomalies.push({
        index,
        field,
        value,
        expectedValue,
        deviation,
        confidence: Math.min(deviation, 1),
        type: 'statistical'
      });
    }
  });
  
  return anomalies;
};

/**
 * Isolation Forest (упрощенная версия)
 */
const detectIsolationAnomalies = (data: any[], field: string): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  const values = data
    .map((row, index) => ({
      index,
      value: typeof row[field] === 'number' ? row[field] : parseFloat(row[field])
    }))
    .filter(item => !isNaN(item.value));
  
  if (values.length < 10) return anomalies;
  
  // Упрощенный алгоритм: находим точки, которые далеко от медианы
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const median = sorted[Math.floor(sorted.length / 2)].value;
  const mad = sorted.map(item => Math.abs(item.value - median))
    .sort((a, b) => a - b)[Math.floor(sorted.length / 2)];
  
  if (mad === 0) return anomalies;
  
  values.forEach(({ index, value }) => {
    const normalizedDeviation = Math.abs(value - median) / mad;
    
    if (normalizedDeviation > 3) {
      anomalies.push({
        index,
        field,
        value,
        expectedValue: median,
        deviation: normalizedDeviation,
        confidence: Math.min(normalizedDeviation / 5, 1),
        type: 'isolation'
      });
    }
  });
  
  return anomalies;
};

/**
 * Обнаружение аномалий в данных
 */
export const detectAnomalies = async (
  data: any[],
  options?: {
    fields?: string[];
    method?: 'zscore' | 'iqr' | 'isolation' | 'all';
    threshold?: number;
  }
): Promise<{
  anomalies: Anomaly[];
  confidence: number;
  summary: {
    total: number;
    byField: Record<string, number>;
    byType: Record<string, number>;
  };
}> => {
  if (!data || data.length === 0) {
    return {
      anomalies: [],
      confidence: 0,
      summary: { total: 0, byField: {}, byType: {} }
    };
  }
  
  const method = options?.method || 'all';
  const threshold = options?.threshold || 3;
  
  // Определяем поля для анализа
  const fields = options?.fields || Object.keys(data[0] || {});
  const numericFields = fields.filter(field => {
    const sample = data.slice(0, Math.min(10, data.length));
    return sample.some(row => {
      const val = row[field];
      return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(parseFloat(val)));
    });
  });
  
  const allAnomalies: Anomaly[] = [];
  
  // Применяем выбранный метод к каждому полю
  for (const field of numericFields) {
    let fieldAnomalies: Anomaly[] = [];
    
    if (method === 'zscore' || method === 'all') {
      fieldAnomalies.push(...detectZScoreAnomalies(data, field, threshold));
    }
    
    if (method === 'iqr' || method === 'all') {
      fieldAnomalies.push(...detectIQRAnomalies(data, field));
    }
    
    if (method === 'isolation' || method === 'all') {
      fieldAnomalies.push(...detectIsolationAnomalies(data, field));
    }
    
    // Убираем дубликаты (одинаковые индексы)
    const uniqueAnomalies = fieldAnomalies.reduce((acc, anomaly) => {
      const existing = acc.find(a => a.index === anomaly.index && a.field === anomaly.field);
      if (!existing || anomaly.confidence > existing.confidence) {
        return acc.filter(a => !(a.index === anomaly.index && a.field === anomaly.field)).concat(anomaly);
      }
      return acc;
    }, [] as Anomaly[]);
    
    allAnomalies.push(...uniqueAnomalies);
  }
  
  // Сортируем по уверенности
  allAnomalies.sort((a, b) => b.confidence - a.confidence);
  
  // Вычисляем общую уверенность
  const avgConfidence = allAnomalies.length > 0
    ? allAnomalies.reduce((sum, a) => sum + a.confidence, 0) / allAnomalies.length
    : 0;
  
  // Создаем сводку
  const summary = {
    total: allAnomalies.length,
    byField: allAnomalies.reduce((acc, a) => {
      acc[a.field] = (acc[a.field] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byType: allAnomalies.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
  
  return {
    anomalies: allAnomalies,
    confidence: avgConfidence,
    summary
  };
};

export default detectAnomalies;
