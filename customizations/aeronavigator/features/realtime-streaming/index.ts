/**
 * Real-time Streaming Analytics Module
 * Обработка потоковых данных в реальном времени
 * Интеграция с Kafka, RabbitMQ, WebSocket
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

interface StreamConfig {
  source: 'kafka' | 'rabbitmq' | 'websocket' | 'mqtt';
  topic?: string;
  queue?: string;
  endpoint?: string;
  format?: 'json' | 'arrow' | 'protobuf';
}

interface StreamHandler {
  onData: (data: any) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

let streamingConnections: Map<string, any> = new Map();

/**
 * Подключение к потоку данных
 */
export const connectStream = async (
  config: StreamConfig,
  handler: StreamHandler
): Promise<string> => {
  if (!AERONAVIGATOR_FEATURES.REALTIME_STREAMING) {
    throw new Error('Real-time streaming is disabled');
  }

  const connectionId = `${config.source}-${Date.now()}`;

  try {
    switch (config.source) {
      case 'kafka':
        await connectKafkaStream(config, handler, connectionId);
        break;
      case 'rabbitmq':
        await connectRabbitMQStream(config, handler, connectionId);
        break;
      case 'websocket':
        await connectWebSocketStream(config, handler, connectionId);
        break;
      case 'mqtt':
        await connectMQTTStream(config, handler, connectionId);
        break;
      default:
        throw new Error(`Unsupported stream source: ${config.source}`);
    }

    return connectionId;
  } catch (error) {
    console.error('[RealTimeStreaming] Connection error:', error);
    throw error;
  }
};

/**
 * Подключение к Kafka через WebSocket proxy
 */
const connectKafkaStream = async (
  config: StreamConfig,
  handler: StreamHandler,
  connectionId: string
) => {
  try {
    const { KafkaClient } = await import('../../../services/kafkaClient');
    const client = new KafkaClient(process.env.REACT_APP_KAFKA_WS_URL || 'ws://localhost/ws/kafka');
    
    await client.connect();
    
    if (config.topic) {
      client.subscribe(config.topic, (message) => {
        try {
          const data = config.format === 'arrow' 
            ? parseArrowData(message.value)
            : JSON.parse(message.value);
          handler.onData(data);
        } catch (error) {
          handler.onError?.(error as Error);
        }
      });
    }
    
    streamingConnections.set(connectionId, client);
    console.log(`[RealTimeStreaming] Kafka stream connected: ${config.topic}`);
  } catch (error) {
    console.error('[RealTimeStreaming] Kafka connection error:', error);
    throw error;
  }
};

/**
 * Подключение к RabbitMQ через WebSocket
 */
const connectRabbitMQStream = async (
  config: StreamConfig,
  handler: StreamHandler,
  connectionId: string
) => {
  try {
    const wsUrl = config.endpoint || process.env.REACT_APP_RABBITMQ_WS_URL || 'ws://localhost/ws/rabbitmq';
    const ws = new WebSocket(`${wsUrl}?queue=${config.queue}`);
    
    ws.onmessage = (event) => {
      try {
        const data = config.format === 'arrow'
          ? parseArrowData(event.data)
          : JSON.parse(event.data);
        handler.onData(data);
      } catch (error) {
        handler.onError?.(error as Error);
      }
    };
    
    ws.onerror = (error) => {
      handler.onError?.(new Error('WebSocket error'));
    };
    
    ws.onclose = () => {
      handler.onComplete?.();
    };
    
    streamingConnections.set(connectionId, ws);
    console.log(`[RealTimeStreaming] RabbitMQ stream connected: ${config.queue}`);
  } catch (error) {
    console.error('[RealTimeStreaming] RabbitMQ connection error:', error);
    throw error;
  }
};

/**
 * Подключение к WebSocket потоку
 */
const connectWebSocketStream = async (
  config: StreamConfig,
  handler: StreamHandler,
  connectionId: string
) => {
  try {
    const wsUrl = config.endpoint || process.env.REACT_APP_STREAM_WS_URL || 'ws://localhost/ws/stream';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        let data;
        if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
          data = config.format === 'arrow'
            ? parseArrowData(event.data)
            : JSON.parse(new TextDecoder().decode(event.data as ArrayBuffer));
        } else {
          data = config.format === 'arrow'
            ? parseArrowData(event.data)
            : JSON.parse(event.data);
        }
        handler.onData(data);
      } catch (error) {
        handler.onError?.(error as Error);
      }
    };
    
    ws.onerror = (error) => {
      handler.onError?.(new Error('WebSocket error'));
    };
    
    ws.onclose = () => {
      handler.onComplete?.();
    };
    
    streamingConnections.set(connectionId, ws);
    console.log(`[RealTimeStreaming] WebSocket stream connected: ${config.endpoint}`);
  } catch (error) {
    console.error('[RealTimeStreaming] WebSocket connection error:', error);
    throw error;
  }
};

/**
 * Подключение к MQTT потоку (для IoT)
 */
const connectMQTTStream = async (
  config: StreamConfig,
  handler: StreamHandler,
  connectionId: string
) => {
  try {
    // Используем WebSocket proxy для MQTT
    const wsUrl = config.endpoint || process.env.REACT_APP_MQTT_WS_URL || 'ws://localhost/ws/mqtt';
    const ws = new WebSocket(`${wsUrl}?topic=${config.topic}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handler.onData(data);
      } catch (error) {
        handler.onError?.(error as Error);
      }
    };
    
    ws.onerror = (error) => {
      handler.onError?.(new Error('MQTT WebSocket error'));
    };
    
    ws.onclose = () => {
      handler.onComplete?.();
    };
    
    streamingConnections.set(connectionId, ws);
    console.log(`[RealTimeStreaming] MQTT stream connected: ${config.topic}`);
  } catch (error) {
    console.error('[RealTimeStreaming] MQTT connection error:', error);
    throw error;
  }
};

/**
 * Парсинг Apache Arrow данных
 */
const parseArrowData = async (data: any): Promise<any> => {
  try {
    // Динамический импорт Apache Arrow
    const arrow = await import('apache-arrow');
    const table = arrow.tableFromIPC(data);
    return table.toArray();
  } catch (error) {
    console.warn('[RealTimeStreaming] Arrow parsing failed, falling back to JSON:', error);
    return JSON.parse(data);
  }
};

/**
 * Отключение от потока
 */
export const disconnectStream = (connectionId: string): void => {
  const connection = streamingConnections.get(connectionId);
  if (connection) {
    if (connection.close) {
      connection.close();
    } else if (connection instanceof WebSocket) {
      connection.close();
    }
    streamingConnections.delete(connectionId);
    console.log(`[RealTimeStreaming] Stream disconnected: ${connectionId}`);
  }
};

/**
 * Инициализация Real-time Streaming
 */
export const initializeRealTimeStreaming = async () => {
  if (!AERONAVIGATOR_FEATURES.REALTIME_STREAMING) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.streaming) {
        datalens.streaming = {
          connect: connectStream,
          disconnect: disconnectStream,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Real-time Streaming initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Real-time Streaming:', error);
  }
};

export default initializeRealTimeStreaming;

