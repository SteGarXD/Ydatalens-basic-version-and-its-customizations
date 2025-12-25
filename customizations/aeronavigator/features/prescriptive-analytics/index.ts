/**
 * Prescriptive Analytics Module
 * Рекомендации действий на основе данных и ML
 * Не только прогнозы, но и конкретные действия
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface Recommendation {
  id: string;
  type: 'action' | 'optimization' | 'alert' | 'suggestion';
  title: string;
  description: string;
  action: string; // Конкретное действие
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  impact?: {
    estimated: string;
    metric?: string;
    value?: number;
  };
  data?: any;
}

/**
 * Генерация рекомендаций на основе данных
 */
export const generateRecommendations = async (
  data: any[],
  context?: {
    domain?: 'aviation' | 'general';
    metrics?: string[];
    goals?: string[];
  }
): Promise<Recommendation[]> => {
  if (!AERONAVIGATOR_FEATURES.PRESCRIPTIVE_ANALYTICS) {
    return [];
  }

  const recommendations: Recommendation[] = [];

  try {
    // Анализ данных для авиации
    if (context?.domain === 'aviation') {
      recommendations.push(...await analyzeAviationData(data));
    }

    // Общий анализ
    recommendations.push(...await analyzeGeneralData(data, context));

    // Сортировка по приоритету и уверенности
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    return recommendations;
  } catch (error) {
    console.error('[PrescriptiveAnalytics] Error generating recommendations:', error);
    return [];
  }
};

/**
 * Анализ авиационных данных
 */
const analyzeAviationData = async (data: any[]): Promise<Recommendation[]> => {
  const recommendations: Recommendation[] = [];

  // Анализ задержек
  const delays = data.filter(row => row.delay && row.delay > 30);
  if (delays.length > 0) {
    const avgDelay = delays.reduce((sum, row) => sum + row.delay, 0) / delays.length;
    recommendations.push({
      id: `delay-${Date.now()}`,
      type: 'action',
      title: 'Высокие задержки рейсов',
      description: `Обнаружено ${delays.length} рейсов с задержкой более 30 минут. Средняя задержка: ${avgDelay.toFixed(0)} минут.`,
      action: 'Предложить альтернативные рейсы пассажирам или перераспределить ресурсы',
      priority: avgDelay > 60 ? 'critical' : 'high',
      confidence: 0.9,
      impact: {
        estimated: 'Снижение недовольства пассажиров',
        metric: 'customer_satisfaction',
        value: 15,
      },
      data: delays.slice(0, 10),
    });
  }

  // Анализ загрузки
  const lowLoad = data.filter(row => {
        const loadFactor = row.passengers && row.capacity 
          ? (row.passengers / row.capacity) * 100 
          : 0;
        return loadFactor < 50;
      });
  if (lowLoad.length > 0) {
    recommendations.push({
      id: `load-${Date.now()}`,
      type: 'optimization',
      title: 'Низкая загрузка рейсов',
      description: `Обнаружено ${lowLoad.length} рейсов с загрузкой менее 50%.`,
      action: 'Предложить скидки или объединить рейсы для оптимизации',
      priority: 'medium',
      confidence: 0.85,
      impact: {
        estimated: 'Увеличение доходности',
        metric: 'revenue',
        value: 10,
      },
      data: lowLoad.slice(0, 10),
    });
  }

  // Анализ топлива
  const highFuel = data.filter(row => row.fuel_consumption && row.fuel_consumption > row.avg_fuel_consumption * 1.2);
  if (highFuel.length > 0) {
    recommendations.push({
      id: `fuel-${Date.now()}`,
      type: 'optimization',
      title: 'Высокое потребление топлива',
      description: `Обнаружено ${highFuel.length} рейсов с потреблением топлива выше среднего на 20%+.`,
      action: 'Проверить маршруты и оптимизировать для снижения расхода топлива',
      priority: 'high',
      confidence: 0.8,
      impact: {
        estimated: 'Снижение затрат на топливо',
        metric: 'fuel_cost',
        value: 12,
      },
      data: highFuel.slice(0, 10),
    });
  }

  return recommendations;
};

/**
 * Общий анализ данных
 */
const analyzeGeneralData = async (
  data: any[],
  context?: { metrics?: string[]; goals?: string[] }
): Promise<Recommendation[]> => {
  const recommendations: Recommendation[] = [];

  if (data.length === 0) {
    return recommendations;
  }

  // Обнаружение аномалий
  try {
    const { detectAnomalies } = await import('../ai-ml/AnomalyDetection');
    const anomalyResult = await detectAnomalies(data, {
      method: 'auto',
      useML: true,
    });

    if (anomalyResult.anomalies.length > 0) {
      recommendations.push({
        id: `anomaly-${Date.now()}`,
        type: 'alert',
        title: 'Обнаружены аномалии в данных',
        description: `Найдено ${anomalyResult.anomalies.length} аномалий. Требуется внимание.`,
        action: 'Проверить данные и выявить причину аномалий',
        priority: 'high',
        confidence: anomalyResult.confidence,
        data: anomalyResult.anomalies.slice(0, 10),
      });
    }
  } catch (error) {
    console.warn('[PrescriptiveAnalytics] Anomaly detection failed:', error);
  }

  // Прогнозы и рекомендации
  try {
    const { generatePredictions } = await import('../ai-ml/PredictiveAnalytics');
    const numericFields = Object.keys(data[0] || {}).filter(key => {
      const val = data[0][key];
      return typeof val === 'number';
    });

    if (numericFields.length > 0) {
      const predictions = await generatePredictions(data, 7, {
        field: numericFields[0],
        useML: true,
      });

      if (predictions.predictions.length > 0) {
        const trend = predictions.predictions[predictions.predictions.length - 1].value - 
                     predictions.predictions[0].value;
        
        if (trend < 0) {
          recommendations.push({
            id: `trend-${Date.now()}`,
            type: 'suggestion',
            title: 'Ожидается снижение показателя',
            description: `Прогноз показывает снижение ${numericFields[0]} на ${Math.abs(trend).toFixed(2)} в ближайшие 7 дней.`,
            action: 'Принять меры для предотвращения снижения',
            priority: 'medium',
            confidence: predictions.confidence,
            impact: {
              estimated: 'Стабилизация показателя',
            },
          });
        }
      }
    }
  } catch (error) {
    console.warn('[PrescriptiveAnalytics] Prediction failed:', error);
  }

  return recommendations;
};

/**
 * Применение рекомендации
 */
export const applyRecommendation = async (recommendation: Recommendation): Promise<void> => {
  try {
    // Логирование применения рекомендации
    await fetch('/api/v1/prescriptive/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recommendation_id: recommendation.id,
        action: recommendation.action,
      }),
    });

    console.log(`[PrescriptiveAnalytics] Recommendation applied: ${recommendation.title}`);
  } catch (error) {
    console.error('[PrescriptiveAnalytics] Error applying recommendation:', error);
  }
};

/**
 * Инициализация Prescriptive Analytics
 */
export const initializePrescriptiveAnalytics = async () => {
  if (!AERONAVIGATOR_FEATURES.PRESCRIPTIVE_ANALYTICS) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.prescriptive) {
        datalens.prescriptive = {
          generate: generateRecommendations,
          apply: applyRecommendation,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Prescriptive Analytics initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Prescriptive Analytics:', error);
  }
};

export default initializePrescriptiveAnalytics;

