/**
 * Enhanced Flight Analytics Module
 * Расширенная аналитика для авиации
 * Анализ задержек, прогноз загрузки, оптимизация маршрутов, анализ топлива
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface DelayAnalysis {
  totalDelays: number;
  avgDelay: number;
  maxDelay: number;
  delayReasons: Record<string, number>;
  delayedFlights: any[];
  recommendations: string[];
}

export interface LoadForecast {
  flightId: string;
  route: string;
  currentLoad: number;
  forecastedLoad: number[];
  confidence: number;
  recommendations: string[];
}

export interface RouteOptimization {
  route: string;
  currentMetrics: {
    avgDelay: number;
    avgLoadFactor: number;
    avgFuelConsumption: number;
    revenue: number;
  };
  optimizedMetrics: {
    avgDelay: number;
    avgLoadFactor: number;
    avgFuelConsumption: number;
    revenue: number;
  };
  improvements: {
    delayReduction: number;
    loadFactorIncrease: number;
    fuelSavings: number;
    revenueIncrease: number;
  };
  recommendations: string[];
}

export interface FuelAnalysis {
  highConsumptionFlights: any[];
  avgConsumption: number;
  savingsPotential: number;
  recommendations: string[];
}

/**
 * Анализ задержек рейсов
 */
export const analyzeDelays = async (data: any[]): Promise<DelayAnalysis> => {
  if (!AERONAVIGATOR_FEATURES.FLIGHT_ANALYTICS) {
    throw new Error('Flight analytics is disabled');
  }

  const delayedFlights = data.filter(row => row.delay && row.delay > 0);
  const totalDelays = delayedFlights.length;
  const avgDelay = totalDelays > 0
    ? delayedFlights.reduce((sum, row) => sum + row.delay, 0) / totalDelays
    : 0;
  const maxDelay = totalDelays > 0
    ? Math.max(...delayedFlights.map(row => row.delay))
    : 0;

  // Анализ причин задержек
  const delayReasons: Record<string, number> = {};
  delayedFlights.forEach(row => {
    const reason = row.delay_reason || 'unknown';
    delayReasons[reason] = (delayReasons[reason] || 0) + 1;
  });

  // Генерация рекомендаций
  const recommendations: string[] = [];
  if (avgDelay > 30) {
    recommendations.push('Средняя задержка превышает 30 минут. Рекомендуется пересмотреть расписание.');
  }
  if (maxDelay > 120) {
    recommendations.push('Обнаружены задержки более 2 часов. Требуется срочное вмешательство.');
  }
  if (delayReasons['weather'] && delayReasons['weather'] > totalDelays * 0.3) {
    recommendations.push('Более 30% задержек из-за погоды. Рассмотрите альтернативные маршруты.');
  }

  return {
    totalDelays,
    avgDelay,
    maxDelay,
    delayReasons,
    delayedFlights: delayedFlights.slice(0, 20),
    recommendations,
  };
};

/**
 * Прогноз загрузки рейсов
 */
export const forecastLoad = async (
  data: any[],
  forecastDays: number = 7
): Promise<LoadForecast[]> => {
  if (!AERONAVIGATOR_FEATURES.FLIGHT_ANALYTICS) {
    throw new Error('Flight analytics is disabled');
  }

  const forecasts: LoadForecast[] = [];

  // Группировка по маршрутам
  const routes = new Map<string, any[]>();
  data.forEach(row => {
    const route = `${row.origin || ''}-${row.destination || ''}`;
    if (!routes.has(route)) {
      routes.set(route, []);
    }
    routes.get(route)!.push(row);
  });

  for (const [route, routeData] of routes.entries()) {
    // Вычисление текущей загрузки
    const loadFactors = routeData
      .filter(row => row.passengers && row.capacity)
      .map(row => (row.passengers / row.capacity) * 100);
    
    const currentLoad = loadFactors.length > 0
      ? loadFactors.reduce((sum, lf) => sum + lf, 0) / loadFactors.length
      : 0;

    // Прогноз загрузки с помощью ML
    try {
      const { generatePredictions } = await import('../ai-ml/PredictiveAnalytics');
      const predictions = await generatePredictions(
        routeData.map(row => ({
          date: row.date || row.departure_date,
          value: row.passengers && row.capacity ? (row.passengers / row.capacity) * 100 : 0,
        })),
        forecastDays,
        {
          field: 'value',
          useML: true,
        }
      );

      const forecastedLoad = predictions.predictions.map(p => p.value);

      // Генерация рекомендаций
      const recommendations: string[] = [];
      const avgForecast = forecastedLoad.reduce((sum, val) => sum + val, 0) / forecastedLoad.length;
      
      if (avgForecast < 50) {
        recommendations.push('Ожидается низкая загрузка. Рассмотрите предложение скидок.');
      } else if (avgForecast > 90) {
        recommendations.push('Ожидается высокая загрузка. Рассмотрите увеличение частоты рейсов.');
      }

      forecasts.push({
        flightId: routeData[0]?.flight_id || route,
        route,
        currentLoad,
        forecastedLoad,
        confidence: predictions.confidence,
        recommendations,
      });
    } catch (error) {
      console.warn('[FlightAnalytics] Forecast failed, using simple average:', error);
      // Fallback: простое среднее
      forecasts.push({
        flightId: routeData[0]?.flight_id || route,
        route,
        currentLoad,
        forecastedLoad: new Array(forecastDays).fill(currentLoad),
        confidence: 0.5,
        recommendations: [],
      });
    }
  }

  return forecasts;
};

/**
 * Оптимизация маршрутов
 */
export const optimizeRoutes = async (data: any[]): Promise<RouteOptimization[]> => {
  if (!AERONAVIGATOR_FEATURES.FLIGHT_ANALYTICS) {
    throw new Error('Flight analytics is disabled');
  }

  const optimizations: RouteOptimization[] = [];

  // Группировка по маршрутам
  const routes = new Map<string, any[]>();
  data.forEach(row => {
    const route = `${row.origin || ''}-${row.destination || ''}`;
    if (!routes.has(route)) {
      routes.set(route, []);
    }
    routes.get(route)!.push(row);
  });

  for (const [route, routeData] of routes.entries()) {
    // Текущие метрики
    const delays = routeData.filter(row => row.delay).map(row => row.delay);
    const loadFactors = routeData
      .filter(row => row.passengers && row.capacity)
      .map(row => (row.passengers / row.capacity) * 100);
    const fuelConsumptions = routeData.filter(row => row.fuel_consumption).map(row => row.fuel_consumption);
    const revenues = routeData.filter(row => row.revenue).map(row => row.revenue);

    const currentMetrics = {
      avgDelay: delays.length > 0 ? delays.reduce((sum, d) => sum + d, 0) / delays.length : 0,
      avgLoadFactor: loadFactors.length > 0 ? loadFactors.reduce((sum, lf) => sum + lf, 0) / loadFactors.length : 0,
      avgFuelConsumption: fuelConsumptions.length > 0 ? fuelConsumptions.reduce((sum, fc) => sum + fc, 0) / fuelConsumptions.length : 0,
      revenue: revenues.length > 0 ? revenues.reduce((sum, r) => sum + r, 0) / revenues.length : 0,
    };

    // Оптимизированные метрики (симуляция улучшений)
    const optimizedMetrics = {
      avgDelay: Math.max(0, currentMetrics.avgDelay * 0.8), // Снижение задержек на 20%
      avgLoadFactor: Math.min(100, currentMetrics.avgLoadFactor * 1.1), // Увеличение загрузки на 10%
      avgFuelConsumption: currentMetrics.avgFuelConsumption * 0.95, // Снижение расхода топлива на 5%
      revenue: currentMetrics.revenue * 1.15, // Увеличение дохода на 15%
    };

    // Улучшения
    const improvements = {
      delayReduction: currentMetrics.avgDelay - optimizedMetrics.avgDelay,
      loadFactorIncrease: optimizedMetrics.avgLoadFactor - currentMetrics.avgLoadFactor,
      fuelSavings: currentMetrics.avgFuelConsumption - optimizedMetrics.avgFuelConsumption,
      revenueIncrease: optimizedMetrics.revenue - currentMetrics.revenue,
    };

    // Генерация рекомендаций
    const recommendations: string[] = [];
    if (currentMetrics.avgDelay > 30) {
      recommendations.push('Оптимизировать расписание для снижения задержек');
    }
    if (currentMetrics.avgLoadFactor < 70) {
      recommendations.push('Улучшить маркетинг для увеличения загрузки');
    }
    if (currentMetrics.avgFuelConsumption > 0) {
      recommendations.push('Оптимизировать маршруты для снижения расхода топлива');
    }

    optimizations.push({
      route,
      currentMetrics,
      optimizedMetrics,
      improvements,
      recommendations,
    });
  }

  return optimizations;
};

/**
 * Анализ топлива
 */
export const analyzeFuel = async (data: any[]): Promise<FuelAnalysis> => {
  if (!AERONAVIGATOR_FEATURES.FLIGHT_ANALYTICS) {
    throw new Error('Flight analytics is disabled');
  }

  const fuelData = data.filter(row => row.fuel_consumption);
  if (fuelData.length === 0) {
    return {
      highConsumptionFlights: [],
      avgConsumption: 0,
      savingsPotential: 0,
      recommendations: [],
    };
  }

  const avgConsumption = fuelData.reduce((sum, row) => sum + row.fuel_consumption, 0) / fuelData.length;
  
  // Рейсы с высоким потреблением (выше среднего на 20%+)
  const highConsumptionFlights = fuelData
    .filter(row => row.fuel_consumption > avgConsumption * 1.2)
    .sort((a, b) => b.fuel_consumption - a.fuel_consumption)
    .slice(0, 20);

  // Потенциал экономии (если снизить потребление на 10%)
  const savingsPotential = fuelData.reduce((sum, row) => {
    const savings = row.fuel_consumption * 0.1;
    return sum + savings;
  }, 0);

  // Генерация рекомендаций
  const recommendations: string[] = [];
  if (highConsumptionFlights.length > 0) {
    recommendations.push(`Обнаружено ${highConsumptionFlights.length} рейсов с высоким потреблением топлива. Проверьте маршруты и условия полета.`);
  }
  if (savingsPotential > 0) {
    recommendations.push(`Потенциал экономии топлива: ${savingsPotential.toFixed(2)} литров при оптимизации на 10%.`);
  }

  return {
    highConsumptionFlights,
    avgConsumption,
    savingsPotential,
    recommendations,
  };
};

/**
 * Инициализация расширенной Flight Analytics
 */
export const initializeFlightAnalyticsEnhanced = async () => {
  if (!AERONAVIGATOR_FEATURES.FLIGHT_ANALYTICS) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.flightAnalytics) {
        datalens.flightAnalytics = {};
      }
      
      datalens.flightAnalytics.analyzeDelays = analyzeDelays;
      datalens.flightAnalytics.forecastLoad = forecastLoad;
      datalens.flightAnalytics.optimizeRoutes = optimizeRoutes;
      datalens.flightAnalytics.analyzeFuel = analyzeFuel;
      
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Enhanced Flight Analytics initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Enhanced Flight Analytics:', error);
  }
};

export default initializeFlightAnalyticsEnhanced;

