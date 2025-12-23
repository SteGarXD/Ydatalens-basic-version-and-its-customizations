/**
 * Анализ маршрутов для авиационной аналитики
 */

export interface Route {
  origin: string;
  destination: string;
  distance?: number;
}

export interface RouteAnalytics {
  route: Route;
  totalFlights: number;
  totalPassengers: number;
  totalRevenue: number;
  averageLoadFactor: number;
  averageZPKPct: number;
}

/**
 * Анализ маршрута
 */
export const analyzeRoute = (
  flights: Array<{
    route: string;
    passengers: number;
    revenue: number;
    loadFactor: number;
    zpkPct: number;
  }>,
  route: Route
): RouteAnalytics => {
  const routeFlights = flights.filter(f => f.route === `${route.origin}-${route.destination}`);

  if (routeFlights.length === 0) {
    return {
      route,
      totalFlights: 0,
      totalPassengers: 0,
      totalRevenue: 0,
      averageLoadFactor: 0,
      averageZPKPct: 0,
    };
  }

  const totalPassengers = routeFlights.reduce((sum, f) => sum + f.passengers, 0);
  const totalRevenue = routeFlights.reduce((sum, f) => sum + f.revenue, 0);
  const averageLoadFactor =
    routeFlights.reduce((sum, f) => sum + f.loadFactor, 0) / routeFlights.length;
  const averageZPKPct =
    routeFlights.reduce((sum, f) => sum + f.zpkPct, 0) / routeFlights.length;

  return {
    route,
    totalFlights: routeFlights.length,
    totalPassengers,
    totalRevenue,
    averageLoadFactor,
    averageZPKPct,
  };
};

/**
 * Сравнить маршруты
 */
export const compareRoutes = (
  routes: RouteAnalytics[]
): {
  bestLoadFactor: RouteAnalytics;
  bestRevenue: RouteAnalytics;
  mostFlights: RouteAnalytics;
} => {
  const bestLoadFactor = routes.reduce((best, current) =>
    current.averageLoadFactor > best.averageLoadFactor ? current : best
  );
  const bestRevenue = routes.reduce((best, current) =>
    current.totalRevenue > best.totalRevenue ? current : best
  );
  const mostFlights = routes.reduce((best, current) =>
    current.totalFlights > best.totalFlights ? current : best
  );

  return { bestLoadFactor, bestRevenue, mostFlights };
};

export default {
  analyzeRoute,
  compareRoutes,
};

