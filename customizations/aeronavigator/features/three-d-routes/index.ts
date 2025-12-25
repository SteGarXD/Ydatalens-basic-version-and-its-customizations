/**
 * 3D Routes Visualization Module
 * 3D-визуализация маршрутов с помощью Three.js
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface Route3D {
  id: string;
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  flights: number;
  avgDelay?: number;
  avgLoadFactor?: number;
}

let threeScene: any = null;

/**
 * Проверка доступности Three.js
 */
export const isThreeAvailable = async (): Promise<boolean> => {
  try {
    await import('three');
    return true;
  } catch {
    return false;
  }
};

/**
 * Инициализация 3D сцены
 */
export const init3DScene = async (
  containerId: string,
  routes: Route3D[]
): Promise<any> => {
  if (!AERONAVIGATOR_FEATURES.THREE_D_ROUTES) {
    throw new Error('3D routes visualization is disabled');
  }

  const available = await isThreeAvailable();
  if (!available) {
    throw new Error('Three.js is not available');
  }

  try {
    const THREE = await import('three');
    
    // Создание сцены
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    const container = document.getElementById(containerId);
    if (container) {
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
    }

    // Добавление маршрутов
    routes.forEach(route => {
      // Создание линии маршрута
      const points = [
        new THREE.Vector3(
          (route.origin.lng - 0) * 10,
          (route.origin.lat - 0) * 10,
          0
        ),
        new THREE.Vector3(
          (route.destination.lng - 0) * 10,
          (route.destination.lat - 0) * 10,
          0
        ),
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: route.avgDelay && route.avgDelay > 30 ? 0xff0000 : 0x00ff00,
        linewidth: route.flights / 10,
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);

      // Добавление точек (аэропорты)
      const originGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const originMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const originPoint = new THREE.Mesh(originGeometry, originMaterial);
      originPoint.position.set(points[0].x, points[0].y, points[0].z);
      scene.add(originPoint);

      const destGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const destMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const destPoint = new THREE.Mesh(destGeometry, destMaterial);
      destPoint.position.set(points[1].x, points[1].y, points[1].z);
      scene.add(destPoint);
    });

    // Настройка камеры
    camera.position.z = 50;
    camera.lookAt(0, 0, 0);

    // Анимация
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    threeScene = { scene, camera, renderer };

    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.threeD) {
        datalens.threeD = {
          init: init3DScene,
          isAvailable: isThreeAvailable,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[3DRoutes] 3D scene initialized');
    return threeScene;
  } catch (error) {
    console.error('[3DRoutes] Error initializing 3D scene:', error);
    throw error;
  }
};

/**
 * Обновление 3D сцены
 */
export const update3DScene = (routes: Route3D[]): void => {
  if (threeScene) {
    // Очистка старой сцены и создание новой
    // (упрощенная версия)
    console.log('[3DRoutes] Scene updated');
  }
};

/**
 * Инициализация 3D Routes
 */
export const initializeThreeDRoutes = async () => {
  if (!AERONAVIGATOR_FEATURES.THREE_D_ROUTES) {
    return;
  }

  try {
    console.log('[AeronavigatorBI] 3D Routes initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing 3D Routes:', error);
  }
};

export default initializeThreeDRoutes;

