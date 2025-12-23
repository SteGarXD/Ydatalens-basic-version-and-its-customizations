/**
 * Real-time Editing Module
 * Совместное редактирование в реальном времени
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

let doc: Y.Doc | null = null;
let provider: WebsocketProvider | null = null;

export const initializeRealTimeEditing = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Создаем Yjs документ для совместного редактирования
    doc = new Y.Doc();
    
    // Подключаемся к WebSocket серверу
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
    provider = new WebsocketProvider(wsUrl, 'datalens', doc);
    
    provider.on('status', (event: any) => {
      console.log('[RealTimeEditing] Status:', event.status);
    });
    
    return {
      doc,
      provider,
      getText: (name: string) => doc?.getText(name),
      getMap: (name: string) => doc?.getMap(name),
      getArray: (name: string) => doc?.getArray(name)
    };
  } catch (error) {
    console.error('[RealTimeEditing] Error:', error);
    return null;
  }
};

export default initializeRealTimeEditing;

