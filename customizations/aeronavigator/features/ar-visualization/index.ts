/**
 * AR Visualization Module
 * AR-визуализация данных через AR.js
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

/**
 * Проверка доступности AR
 */
export const isARAvailable = (): boolean => {
  if (!AERONAVIGATOR_FEATURES.AR_VISUALIZATION) {
    return false;
  }

  return 'getUserMedia' in navigator.mediaDevices;
};

/**
 * Инициализация AR сцены
 */
export const initARScene = async (
  containerId: string,
  data: any[]
): Promise<void> => {
  if (!AERONAVIGATOR_FEATURES.AR_VISUALIZATION) {
    throw new Error('AR visualization is disabled');
  }

  if (!isARAvailable()) {
    throw new Error('AR is not available in this browser');
  }

  try {
    // Динамический импорт AR.js
    // AR.js требует специальной HTML разметки, поэтому возвращаем конфигурацию
    const arConfig = {
      containerId,
      data,
      markerPattern: 'hiro', // Маркер для AR
    };

    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.ar) {
        datalens.ar = {
          init: initARScene,
          isAvailable: isARAvailable,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AR] AR scene initialized');
    return arConfig as any;
  } catch (error) {
    console.error('[AR] Error initializing AR scene:', error);
    throw error;
  }
};

/**
 * Создание AR компонента для React
 */
export const createARComponent = (data: any[]) => {
  // Возвращаем конфигурацию для AR.js компонента
  return {
    type: 'a-scene',
    'embedded': true,
    'arjs': 'sourceType: webcam;',
    children: [
      {
        type: 'a-marker',
        preset: 'hiro',
        children: data.map((item, index) => ({
          type: 'a-box',
          position: `${index * 0.5} ${index * 0.2} 0`,
          rotation: '0 45 0',
          color: '#4CC3D9',
          'data-value': item.value || 0,
        })),
      },
      {
        type: 'a-entity',
        camera: true,
        'look-controls': true,
      },
    ],
  };
};

/**
 * Инициализация AR Visualization
 */
export const initializeARVisualization = async () => {
  if (!AERONAVIGATOR_FEATURES.AR_VISUALIZATION) {
    return;
  }

  try {
    console.log('[AeronavigatorBI] AR Visualization initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing AR Visualization:', error);
  }
};

export default initializeARVisualization;

