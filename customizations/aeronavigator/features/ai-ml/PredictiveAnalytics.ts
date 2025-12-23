/**
 * Predictive Analytics Module
 * Прогнозная аналитика
 * Использует статистические методы временных рядов (бесплатно, безопасно для РФ)
 */

interface Prediction {
  date: string | number;
  value: number;
  lowerBound?: number;
  upperBound?: number;
  confidence: number;
}

/**
 * Простое экспоненциальное сглаживание (Simple Exponential Smoothing)
 */
const simpleExponentialSmoothing = (values: number[], alpha: number = 0.3): number[] => {
  if (values.length === 0) return [];
  
  const smoothed: number[] = [values[0]];
  
  for (let i = 1; i < values.length; i++) {
    smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
  }
  
  return smoothed;
};

/**
 * Линейная регрессия для прогноза
 */
const linearRegression = (x: number[], y: number[]): {
  slope: number;
  intercept: number;
  r2: number;
} => {
  const n = x.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Вычисляем R²
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, val, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(val - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  
  return { slope, intercept, r2 };
};

/**
 * Вычисление тренда (тренд + сезонность)
 */
const detectTrendAndSeasonality = (values: number[]): {
  trend: number[];
  seasonality: number[];
  hasSeasonality: boolean;
} => {
  if (values.length < 12) {
    return {
      trend: values,
      seasonality: new Array(values.length).fill(0),
      hasSeasonality: false
    };
  }
  
  // Простое скользящее среднее для тренда
  const window = Math.min(12, Math.floor(values.length / 4));
  const trend: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, i + Math.ceil(window / 2));
    const windowValues = values.slice(start, end);
    trend.push(windowValues.reduce((sum, v) => sum + v, 0) / windowValues.length);
  }
  
  // Вычисляем сезонность
  const seasonality = values.map((val, i) => val - trend[i]);
  
  // Проверяем наличие сезонности (вариация сезонной компоненты)
  const seasonalityVariance = seasonality.reduce((sum, s) => sum + s * s, 0) / seasonality.length;
  const dataVariance = values.reduce((sum, v, i) => {
    const mean = values.reduce((s, val) => s + val, 0) / values.length;
    return sum + Math.pow(v - mean, 2);
  }, 0) / values.length;
  
  const hasSeasonality = seasonalityVariance > dataVariance * 0.1;
  
  return { trend, seasonality, hasSeasonality };
};

/**
 * Генерация прогнозов
 */
export const generatePredictions = async (
  data: any[],
  forecastPeriod: number,
  options?: {
    field?: string;
    dateField?: string;
    method?: 'linear' | 'exponential' | 'trend' | 'auto';
  }
): Promise<{
  predictions: Prediction[];
  confidence: number;
  method: string;
  metrics?: {
    mse?: number;
    mae?: number;
    mape?: number;
  };
}> => {
  if (!data || data.length === 0 || forecastPeriod <= 0) {
    return {
      predictions: [],
      confidence: 0,
      method: options?.method || 'auto'
    };
  }
  
  const field = options?.field || Object.keys(data[0] || {}).find(key => {
    const val = data[0][key];
        return typeof val === 'number';
      });
  
  if (!field) {
    return {
      predictions: [],
      confidence: 0,
      method: options?.method || 'auto'
    };
  }
  
  // Извлекаем значения
  const values = data
    .map(row => {
      const val = row[field];
      return typeof val === 'number' ? val : parseFloat(val);
    })
    .filter(v => !isNaN(v) && isFinite(v));
  
  if (values.length < 3) {
    return {
      predictions: [],
      confidence: 0,
      method: options?.method || 'auto'
    };
  }
  
  const method = options?.method || 'auto';
  let predictions: Prediction[] = [];
  let confidence = 0;
  let usedMethod = method;
  
  // Линейная регрессия
  if (method === 'linear' || method === 'auto') {
    const x = Array.from({ length: values.length }, (_, i) => i);
    const regression = linearRegression(x, values);
    
    const lastX = values.length - 1;
    const lastValue = values[values.length - 1];
    const stdDev = Math.sqrt(
      values.reduce((sum, val, i) => {
        const predicted = regression.slope * i + regression.intercept;
        return sum + Math.pow(val - predicted, 2);
      }, 0) / values.length
    );
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const futureX = lastX + i;
      const predicted = regression.slope * futureX + regression.intercept;
      const error = stdDev * Math.sqrt(1 + 1 / values.length + Math.pow(futureX - (values.length - 1) / 2, 2) / 
        (values.reduce((sum, val, idx) => sum + Math.pow(idx - (values.length - 1) / 2, 2), 0)));
      
      predictions.push({
        date: futureX,
        value: predicted,
        lowerBound: predicted - 1.96 * error,
        upperBound: predicted + 1.96 * error,
        confidence: Math.max(0, Math.min(1, regression.r2))
      });
    }
    
    confidence = regression.r2;
    usedMethod = 'linear';
  }
  
  // Экспоненциальное сглаживание
  if (method === 'exponential' || (method === 'auto' && confidence < 0.7)) {
    const alpha = 0.3;
    const smoothed = simpleExponentialSmoothing(values, alpha);
    const lastSmoothed = smoothed[smoothed.length - 1];
    const trend = smoothed.length > 1 
      ? smoothed[smoothed.length - 1] - smoothed[smoothed.length - 2]
      : 0;
    
    const stdDev = Math.sqrt(
      values.slice(1).reduce((sum, val, i) => {
        return sum + Math.pow(val - smoothed[i], 2);
      }, 0) / (values.length - 1)
    );
    
    const newPredictions: Prediction[] = [];
    for (let i = 1; i <= forecastPeriod; i++) {
      const predicted = lastSmoothed + trend * i;
      newPredictions.push({
        date: values.length - 1 + i,
        value: predicted,
        lowerBound: predicted - 1.96 * stdDev,
        upperBound: predicted + 1.96 * stdDev,
        confidence: 0.6
      });
    }
    
    if (method === 'exponential' || predictions.length === 0) {
      predictions = newPredictions;
      confidence = 0.6;
      usedMethod = 'exponential';
    }
  }
  
  // Тренд + сезонность
  if (method === 'trend' || (method === 'auto' && values.length >= 12)) {
    const { trend, seasonality, hasSeasonality } = detectTrendAndSeasonality(values);
    
    const trendRegression = linearRegression(
      Array.from({ length: trend.length }, (_, i) => i),
      trend
    );
    
    const lastTrend = trend[trend.length - 1];
    const trendSlope = trendRegression.slope;
    
    const newPredictions: Prediction[] = [];
    for (let i = 1; i <= forecastPeriod; i++) {
      const futureTrend = lastTrend + trendSlope * i;
      const seasonIndex = hasSeasonality ? (values.length - 12 + i) % 12 : 0;
      const seasonalComponent = hasSeasonality && seasonality.length >= 12
        ? seasonality[seasonIndex]
        : 0;
      
      const predicted = futureTrend + seasonalComponent;
      
      newPredictions.push({
        date: values.length - 1 + i,
        value: predicted,
        confidence: hasSeasonality ? 0.7 : 0.5
      });
    }
    
    if (method === 'trend') {
      predictions = newPredictions;
      confidence = hasSeasonality ? 0.7 : 0.5;
      usedMethod = 'trend';
    }
  }
  
  // Вычисляем метрики качества (если есть исторические данные)
  let metrics;
  if (values.length >= forecastPeriod * 2) {
    const testSize = forecastPeriod;
    const trainData = values.slice(0, values.length - testSize);
    const testData = values.slice(values.length - testSize);
    
    // Делаем прогноз на тестовый период
    const testX = Array.from({ length: trainData.length }, (_, i) => i);
    const testRegression = linearRegression(testX, trainData);
    
    const testPredictions = testData.map((_, i) => {
      const x = trainData.length + i;
      return testRegression.slope * x + testRegression.intercept;
    });
    
    const mse = testData.reduce((sum, val, i) => {
      return sum + Math.pow(val - testPredictions[i], 2);
    }, 0) / testData.length;
    
    const mae = testData.reduce((sum, val, i) => {
      return sum + Math.abs(val - testPredictions[i]);
    }, 0) / testData.length;
    
    const mape = testData.reduce((sum, val, i) => {
      return sum + Math.abs((val - testPredictions[i]) / val);
    }, 0) / testData.length * 100;
    
    metrics = { mse, mae, mape };
  }
  
  return {
    predictions,
    confidence: Math.max(0, Math.min(1, confidence)),
    method: usedMethod,
    metrics
  };
};

export default generatePredictions;
