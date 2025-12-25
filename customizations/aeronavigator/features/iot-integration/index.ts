/**
 * IoT Integration Module
 * Интеграция с IoT устройствами и датчиками (самолеты, датчики)
 * MQTT, WebSocket для real-time данных
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

interface IoTDevice {
  id: string;
  name: string;
  type: 'aircraft' | 'sensor' | 'gate' | 'other';
  status: 'online' | 'offline' | 'maintenance';
  lastUpdate: Date;
  data?: Record<string, any>;
}

interface SensorData {
  deviceId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  location?: { lat: number; lng: number };
}

let iotConnections: Map<string, any> = new Map();

/**
 * Подключение к IoT устройству через MQTT
 */
export const connectIoTDevice = async (
  deviceId: string,
  config: {
    protocol: 'mqtt' | 'websocket';
    endpoint?: string;
    topic?: string;
  },
  onData: (data: SensorData) => void
): Promise<string> => {
  if (!AERONAVIGATOR_FEATURES.IOT_INTEGRATION) {
    throw new Error('IoT integration is disabled');
  }

  const connectionId = `iot-${deviceId}-${Date.now()}`;

  try {
    if (config.protocol === 'mqtt') {
      // MQTT через WebSocket proxy
      const wsUrl = config.endpoint || process.env.REACT_APP_MQTT_WS_URL || 'ws://localhost/ws/mqtt';
      const ws = new WebSocket(`${wsUrl}?device=${deviceId}&topic=${config.topic || `devices/${deviceId}`}`);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const sensorData: SensorData = {
            deviceId,
            timestamp: new Date(message.timestamp || Date.now()),
            metrics: message.metrics || {},
            location: message.location,
          };
          onData(sensorData);
        } catch (error) {
          console.error('[IoT] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[IoT] WebSocket error:', error);
      };

      iotConnections.set(connectionId, ws);
    } else {
      // Прямой WebSocket
      const wsUrl = config.endpoint || `ws://localhost/ws/iot/${deviceId}`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const sensorData: SensorData = {
            deviceId,
            timestamp: new Date(message.timestamp || Date.now()),
            metrics: message.metrics || {},
            location: message.location,
          };
          onData(sensorData);
        } catch (error) {
          console.error('[IoT] Error parsing message:', error);
        }
      };

      iotConnections.set(connectionId, ws);
    }

    console.log(`[IoT] Connected to device: ${deviceId}`);
    return connectionId;
  } catch (error) {
    console.error('[IoT] Connection error:', error);
    throw error;
  }
};

/**
 * Отключение от IoT устройства
 */
export const disconnectIoTDevice = (connectionId: string): void => {
  const connection = iotConnections.get(connectionId);
  if (connection) {
    if (connection instanceof WebSocket) {
      connection.close();
    }
    iotConnections.delete(connectionId);
    console.log(`[IoT] Disconnected: ${connectionId}`);
  }
};

/**
 * Получение списка IoT устройств
 */
export const getIoTDevices = async (): Promise<IoTDevice[]> => {
  try {
    const response = await fetch('/api/v1/iot/devices');
    if (!response.ok) {
      throw new Error('Failed to fetch IoT devices');
    }
    const result = await response.json();
    return result.devices || [];
  } catch (error) {
    console.error('[IoT] Error fetching devices:', error);
    return [];
  }
};

/**
 * Получение данных с устройства
 */
export const getDeviceData = async (
  deviceId: string,
  timeRange?: { from: Date; to: Date }
): Promise<SensorData[]> => {
  try {
    const params = new URLSearchParams();
    if (timeRange) {
      params.append('from', timeRange.from.toISOString());
      params.append('to', timeRange.to.toISOString());
    }

    const response = await fetch(`/api/v1/iot/devices/${deviceId}/data?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch device data');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('[IoT] Error fetching device data:', error);
    return [];
  }
};

/**
 * Анализ данных с IoT устройств
 */
export const analyzeIoTData = async (
  deviceId: string,
  data: SensorData[]
): Promise<{
  anomalies: SensorData[];
  trends: Record<string, 'increasing' | 'decreasing' | 'stable'>;
  recommendations: string[];
}> => {
  if (!AERONAVIGATOR_FEATURES.IOT_INTEGRATION) {
    throw new Error('IoT integration is disabled');
  }

  // Обнаружение аномалий
  const anomalies: SensorData[] = [];
  const trends: Record<string, 'increasing' | 'decreasing' | 'stable'> = {};
  const recommendations: string[] = [];

  try {
    // Конвертация в формат для анализа
    const analysisData = data.map(d => ({
      ...d.metrics,
      timestamp: d.timestamp.getTime(),
    }));

    if (analysisData.length > 0) {
      const { detectAnomalies } = await import('../ai-ml/AnomalyDetection');
      const anomalyResult = await detectAnomalies(analysisData, {
        method: 'auto',
        useML: true,
      });

      anomalyResult.anomalies.forEach(anomaly => {
        const sensorData = data[anomaly.index];
        if (sensorData) {
          anomalies.push(sensorData);
        }
      });

      // Анализ трендов
      const metrics = Object.keys(analysisData[0] || {}).filter(k => k !== 'timestamp');
      metrics.forEach(metric => {
        const values = analysisData.map(d => d[metric]).filter(v => typeof v === 'number');
        if (values.length >= 2) {
          const firstHalf = values.slice(0, Math.floor(values.length / 2));
          const secondHalf = values.slice(Math.floor(values.length / 2));
          const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
          
          if (secondAvg > firstAvg * 1.1) {
            trends[metric] = 'increasing';
          } else if (secondAvg < firstAvg * 0.9) {
            trends[metric] = 'decreasing';
          } else {
            trends[metric] = 'stable';
          }
        }
      });

      // Генерация рекомендаций
      if (anomalies.length > 0) {
        recommendations.push(`Обнаружено ${anomalies.length} аномалий. Требуется проверка устройства.`);
      }

      Object.entries(trends).forEach(([metric, trend]) => {
        if (trend === 'increasing') {
          recommendations.push(`Метрика ${metric} растет. Возможно требуется обслуживание.`);
        } else if (trend === 'decreasing') {
          recommendations.push(`Метрика ${metric} снижается. Проверьте работоспособность.`);
        }
      });
    }
  } catch (error) {
    console.error('[IoT] Analysis error:', error);
  }

  return {
    anomalies,
    trends,
    recommendations,
  };
};

/**
 * Инициализация IoT Integration
 */
export const initializeIoTIntegration = async () => {
  if (!AERONAVIGATOR_FEATURES.IOT_INTEGRATION) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.iot) {
        datalens.iot = {
          connect: connectIoTDevice,
          disconnect: disconnectIoTDevice,
          getDevices: getIoTDevices,
          getData: getDeviceData,
          analyze: analyzeIoTData,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] IoT Integration initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing IoT Integration:', error);
  }
};

export default initializeIoTIntegration;

