export { default as flightAggregations } from './flight-aggregations';
export { default as routeAnalytics } from './route-analytics';

import { AERONAVIGATOR_FEATURES } from '../config';

/**
 * Инициализация Flight Analytics модуля
 */
export const initializeFlightAnalytics = async () => {
  if (!AERONAVIGATOR_FEATURES.FLIGHT_ANALYTICS) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.flightAnalytics) {
        datalens.flightAnalytics = {
          aggregations: await import('./flight-aggregations'),
          routeAnalytics: await import('./route-analytics'),
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Flight Analytics initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Flight Analytics:', error);
  }
};

export default initializeFlightAnalytics;

