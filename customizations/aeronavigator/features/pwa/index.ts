/**
 * Progressive Web App (PWA) Module
 * Service Workers, офлайн режим, push уведомления
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

/**
 * Регистрация Service Worker
 */
export const registerServiceWorker = async (): Promise<void> => {
  if (!AERONAVIGATOR_FEATURES.PWA) {
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', registration.scope);

      // Обновление Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker available');
            }
          });
        }
      });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }
};

/**
 * Запрос разрешения на push уведомления
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!AERONAVIGATOR_FEATURES.PWA) {
    return false;
  }

  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
  return false;
};

/**
 * Отправка push уведомления
 */
export const sendPushNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<void> => {
  if (!AERONAVIGATOR_FEATURES.PWA) {
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (hasPermission) {
    new Notification(title, {
      icon: '/OP-compass.png',
      badge: '/OP-compass.png',
      ...options,
    });
  }
};

/**
 * Кэширование данных для офлайн режима
 */
export const cacheData = async (key: string, data: any): Promise<void> => {
  if (!AERONAVIGATOR_FEATURES.PWA) {
    return;
  }

  try {
    if ('indexedDB' in window) {
      // Использование IndexedDB для кэширования
      const request = indexedDB.open('AeronavigatorBI', 1);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.put({ key, data, timestamp: Date.now() });
      };
    } else {
      // Fallback на localStorage
      localStorage.setItem(`pwa_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    }
  } catch (error) {
    console.error('[PWA] Cache error:', error);
  }
};

/**
 * Получение кэшированных данных
 */
export const getCachedData = async (key: string): Promise<any | null> => {
  if (!AERONAVIGATOR_FEATURES.PWA) {
    return null;
  }

  try {
    if ('indexedDB' in window) {
      return new Promise((resolve) => {
        const request = indexedDB.open('AeronavigatorBI', 1);
        
        request.onsuccess = (event: any) => {
          const db = event.target.result;
          const transaction = db.transaction(['cache'], 'readonly');
          const store = transaction.objectStore('cache');
          const getRequest = store.get(key);
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
              resolve(result.data);
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = () => resolve(null);
        };
        
        request.onerror = () => resolve(null);
      });
    } else {
      // Fallback на localStorage
      const cached = localStorage.getItem(`pwa_cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
      return null;
    }
  } catch (error) {
    console.error('[PWA] Get cache error:', error);
    return null;
  }
};

/**
 * Установка PWA
 */
export const installPWA = async (): Promise<void> => {
  if (!AERONAVIGATOR_FEATURES.PWA) {
    return;
  }

  // PWA install prompt
  if ('serviceWorker' in navigator) {
    await registerServiceWorker();
    await requestNotificationPermission();
    console.log('[PWA] PWA installation initiated');
  }
};

/**
 * Инициализация PWA
 */
export const initializePWA = async () => {
  if (!AERONAVIGATOR_FEATURES.PWA) {
    return;
  }

  try {
    // Регистрация Service Worker
    await registerServiceWorker();

    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.pwa) {
        datalens.pwa = {
          install: installPWA,
          sendNotification: sendPushNotification,
          cache: cacheData,
          getCached: getCachedData,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] PWA initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing PWA:', error);
  }
};

export default initializePWA;

