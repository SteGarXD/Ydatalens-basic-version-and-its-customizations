/**
 * AI/ML Module
 * Интеграция AI и машинного обучения в DataLens
 * Использует TensorFlow.js и scikit-learn (бесплатно, безопасно для РФ)
 * Превосходит возможности облачной версии
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

/**
 * Инициализация AI/ML модуля
 */
export const initializeAIML = async () => {
  if (!AERONAVIGATOR_FEATURES.AI_ML) {
    return;
  }

  try {
    // Инициализация ML интеграции
    const { initializeML } = await import('./MLIntegration');
    await initializeML();
    
    // Регистрация AI функций в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      
      if (!datalens.ai) {
        datalens.ai = {};
      }
      
      // Автоматические инсайты
      if (AERONAVIGATOR_FEATURES.AUTO_INSIGHTS) {
        datalens.ai.autoInsights = await import('./AutoInsights');
      }
      
      // Обнаружение аномалий (с TensorFlow.js и scikit-learn)
      if (AERONAVIGATOR_FEATURES.ANOMALY_DETECTION) {
        datalens.ai.anomalyDetection = await import('./AnomalyDetection');
      }
      
      // Прогнозная аналитика (с TensorFlow.js и scikit-learn)
      if (AERONAVIGATOR_FEATURES.PREDICTIVE_ANALYTICS) {
        datalens.ai.predictiveAnalytics = await import('./PredictiveAnalytics');
      }
      
      // Запросы на естественном языке
      if (AERONAVIGATOR_FEATURES.NATURAL_LANGUAGE_QUERY) {
        datalens.ai.naturalLanguageQuery = await import('./NaturalLanguageQuery');
      }
      
      // Автоматические предложения графиков
      if (AERONAVIGATOR_FEATURES.AUTO_CHART_SUGGESTIONS) {
        datalens.ai.chartSuggestions = await import('./ChartSuggestions');
      }
      
      // TensorFlow.js ML функции
      try {
        datalens.ai.tensorflow = await import('./TensorFlowML');
      } catch (error) {
        console.warn('[AeronavigatorBI] TensorFlow.js not available');
      }
      
      // ML интеграция
      datalens.ai.ml = await import('./MLIntegration');
      
      (window as any).datalens = datalens;
      
      console.log('[AeronavigatorBI] AI/ML module initialized with TensorFlow.js and scikit-learn support');
    }
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing AI/ML:', error);
  }
};

export default initializeAIML;

