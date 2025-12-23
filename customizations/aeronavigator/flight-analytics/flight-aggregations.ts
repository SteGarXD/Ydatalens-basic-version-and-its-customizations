/**
 * Специфичные агрегации для авиационной аналитики
 * Функции для анализа рейсов ООО "Аэронавигатор"
 */

export interface FlightAggregation {
  flight: string;
  route: string;
  date: string;
  passengers: number;
  capacity: number;
  revenue: number;
  zpk_pct: number;
  load_factor: number;
}

/**
 * Расчет ЗПК % (ЗПК = заброн / ПКЗ * 100)
 */
export const calculateZPKPct = (zabron: number, pkz: number): number => {
  if (!pkz || pkz === 0) return 0;
  return (zabron / pkz) * 100;
};

/**
 * Расчет коэффициента загрузки (load factor)
 */
export const calculateLoadFactor = (passengers: number, capacity: number): number => {
  if (!capacity || capacity === 0) return 0;
  return (passengers / capacity) * 100;
};

/**
 * Агрегация по рейсам
 */
export const aggregateByFlight = (data: FlightAggregation[]): Record<string, FlightAggregation> => {
  const result: Record<string, FlightAggregation> = {};
  
  data.forEach(item => {
    if (!result[item.flight]) {
      result[item.flight] = {
        ...item,
        passengers: 0,
        revenue: 0,
        zpk_pct: 0,
        load_factor: 0,
      };
    }
    
    result[item.flight].passengers += item.passengers;
    result[item.flight].revenue += item.revenue;
  });
  
  // Пересчитать проценты после агрегации
  Object.values(result).forEach(item => {
    item.zpk_pct = calculateZPKPct(item.passengers, item.capacity);
    item.load_factor = calculateLoadFactor(item.passengers, item.capacity);
  });
  
  return result;
};

/**
 * Агрегация по маршрутам
 */
export const aggregateByRoute = (data: FlightAggregation[]): Record<string, FlightAggregation> => {
  const result: Record<string, FlightAggregation> = {};
  
  data.forEach(item => {
    if (!result[item.route]) {
      result[item.route] = {
        ...item,
        passengers: 0,
        revenue: 0,
        zpk_pct: 0,
        load_factor: 0,
      };
    }
    
    result[item.route].passengers += item.passengers;
    result[item.route].revenue += item.revenue;
  });
  
  // Пересчитать проценты
  Object.values(result).forEach(item => {
    item.zpk_pct = calculateZPKPct(item.passengers, item.capacity);
    item.load_factor = calculateLoadFactor(item.passengers, item.capacity);
  });
  
  return result;
};

/**
 * Анализ загрузки самолетов
 */
export const analyzeAircraftLoad = (data: FlightAggregation[]) => {
  const totalPassengers = data.reduce((sum, item) => sum + item.passengers, 0);
  const totalCapacity = data.reduce((sum, item) => sum + item.capacity, 0);
  const averageLoadFactor = calculateLoadFactor(totalPassengers, totalCapacity);
  
  return {
    totalPassengers,
    totalCapacity,
    averageLoadFactor,
    utilization: (totalPassengers / totalCapacity) * 100,
  };
};

export default {
  calculateZPKPct,
  calculateLoadFactor,
  aggregateByFlight,
  aggregateByRoute,
  analyzeAircraftLoad,
};

