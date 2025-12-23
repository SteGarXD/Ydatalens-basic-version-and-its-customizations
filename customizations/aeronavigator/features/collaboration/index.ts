/**
 * Real-time Collaboration Module
 * Совместная работа в реальном времени
 * Превосходит возможности облачной версии
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

/**
 * Инициализация Collaboration модуля
 */
export const initializeCollaboration = async () => {
  if (!AERONAVIGATOR_FEATURES.COLLABORATION) {
    return;
  }

  try {
    // Инициализация WebSocket соединения для real-time collaboration
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      
      if (!datalens.collaboration) {
        datalens.collaboration = {};
      }
      
      // Real-time editing
      if (AERONAVIGATOR_FEATURES.REAL_TIME_EDITING) {
        const { initializeRealTimeEditing } = await import('./RealTimeEditing');
        datalens.collaboration.realTimeEditing = initializeRealTimeEditing();
      }
      
      // Presence indicators
      if (AERONAVIGATOR_FEATURES.PRESENCE_INDICATORS) {
        const { initializePresence } = await import('./PresenceIndicators');
        datalens.collaboration.presence = initializePresence();
      }
      
      // Live comments
      if (AERONAVIGATOR_FEATURES.LIVE_COMMENTS) {
        const { initializeLiveComments } = await import('./LiveComments');
        datalens.collaboration.comments = initializeLiveComments();
      }
      
      (window as any).datalens = datalens;
      
      console.log('[AeronavigatorBI] Collaboration module initialized');
    }
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Collaboration:', error);
  }
};

export default initializeCollaboration;

