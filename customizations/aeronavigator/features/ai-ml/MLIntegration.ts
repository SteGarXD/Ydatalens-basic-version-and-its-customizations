/**
 * ML Integration Module
 * Интеграция TensorFlow.js и scikit-learn в AI/ML функции
 * Автоматическое переключение между статистическими и ML методами
 */

/**
 * Проверка доступности TensorFlow.js
 */
export const isTensorFlowAvailable = async (): Promise<boolean> => {
  try {
    await import('@tensorflow/tfjs');
    return true;
  } catch {
    return false;
  }
};

/**
 * Проверка доступности backend ML API
 */
export const isBackendMLAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/v1/ml/models', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Получить лучший доступный метод для задачи
 */
export const getBestMLMethod = async (
  task: 'anomaly' | 'forecast' | 'clustering',
  useStatisticalFallback: boolean = true
): Promise<{
  method: 'tensorflow' | 'backend' | 'statistical' | 'none';
  available: boolean;
  reason?: string;
}> => {
  const { ML_CONFIG } = await import('../../config');
  const tfAvailable = await isTensorFlowAvailable();
  const backendAvailable = await isBackendMLAvailable();
  
  // Приоритет: backend (scikit-learn) > TensorFlow.js > статистические методы
  if (backendAvailable) {
    return { 
      method: 'backend', 
      available: true,
      reason: 'Backend scikit-learn available (highest priority)'
    };
  }
  
  if (tfAvailable) {
    return { 
      method: 'tensorflow', 
      available: true,
      reason: 'TensorFlow.js available (medium priority)'
    };
  }
  
  if (useStatisticalFallback && ML_CONFIG.useStatisticalFallback) {
    return { 
      method: 'statistical', 
      available: true,
      reason: 'Statistical methods available as fallback (lowest priority)'
    };
  }
  
  return { 
    method: 'none', 
    available: false,
    reason: 'No ML methods available and statistical fallback is disabled'
  };
};

/**
 * Инициализация ML модулей
 */
export const initializeML = async () => {
  const { ML_CONFIG } = await import('../../config');
  const tfAvailable = await isTensorFlowAvailable();
  const backendAvailable = await isBackendMLAvailable();
  
  const methods: string[] = [];
  
  if (backendAvailable) {
    methods.push('Backend scikit-learn (Priority 1)');
    console.log('[AeronavigatorBI] Backend ML (scikit-learn) available - Priority 1');
  }
  
  if (tfAvailable) {
    methods.push('TensorFlow.js (Priority 2)');
    console.log('[AeronavigatorBI] TensorFlow.js available - Priority 2');
  }
  
  if (ML_CONFIG.useStatisticalFallback) {
    methods.push('Statistical methods (Priority 3 - Fallback)');
    console.log('[AeronavigatorBI] Statistical methods enabled as fallback - Priority 3');
  } else {
    console.log('[AeronavigatorBI] Statistical methods disabled in config');
  }
  
  if (methods.length === 0) {
    console.warn('[AeronavigatorBI] No ML methods available!');
  } else {
    console.log(`[AeronavigatorBI] Available methods: ${methods.join(', ')}`);
  }
  
  return {
    tensorflow: tfAvailable,
    backend: backendAvailable,
    statistical: ML_CONFIG.useStatisticalFallback,
    methods: methods
  };
};

export default {
  isTensorFlowAvailable,
  isBackendMLAvailable,
  getBestMLMethod,
  initializeML
};

