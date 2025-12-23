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
export const getBestMLMethod = async (task: 'anomaly' | 'forecast' | 'clustering'): Promise<{
  method: 'tensorflow' | 'backend' | 'statistical';
  available: boolean;
}> => {
  const tfAvailable = await isTensorFlowAvailable();
  const backendAvailable = await isBackendMLAvailable();
  
  // Приоритет: backend (scikit-learn) > TensorFlow.js > статистические методы
  if (backendAvailable) {
    return { method: 'backend', available: true };
  }
  
  if (tfAvailable) {
    return { method: 'tensorflow', available: true };
  }
  
  return { method: 'statistical', available: true };
};

/**
 * Инициализация ML модулей
 */
export const initializeML = async () => {
  const tfAvailable = await isTensorFlowAvailable();
  const backendAvailable = await isBackendMLAvailable();
  
  if (tfAvailable) {
    console.log('[AeronavigatorBI] TensorFlow.js available for ML');
  }
  
  if (backendAvailable) {
    console.log('[AeronavigatorBI] Backend ML (scikit-learn) available');
  }
  
  if (!tfAvailable && !backendAvailable) {
    console.log('[AeronavigatorBI] Using statistical methods only (ML libraries not available)');
  }
  
  return {
    tensorflow: tfAvailable,
    backend: backendAvailable
  };
};

export default {
  isTensorFlowAvailable,
  isBackendMLAvailable,
  getBestMLMethod,
  initializeML
};

