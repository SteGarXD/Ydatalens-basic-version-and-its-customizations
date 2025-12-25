/**
 * Voice Queries Module
 * Голосовые запросы на естественном языке
 * Интеграция с Web Speech API и Natural Language Query
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

let recognition: any = null;
let isListening = false;

/**
 * Проверка доступности Web Speech API
 */
export const isVoiceAvailable = (): boolean => {
  if (!AERONAVIGATOR_FEATURES.VOICE_QUERIES) {
    return false;
  }

  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

/**
 * Инициализация распознавания речи
 */
const initSpeechRecognition = (): any => {
  if (!isVoiceAvailable()) {
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'ru-RU';
  recognition.continuous = false;
  recognition.interimResults = false;

  return recognition;
};

/**
 * Начать прослушивание голосового запроса
 */
export const startListening = async (
  onResult: (query: string) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  if (!AERONAVIGATOR_FEATURES.VOICE_QUERIES) {
    throw new Error('Voice queries are disabled');
  }

  if (!isVoiceAvailable()) {
    throw new Error('Speech recognition is not available in this browser');
  }

  if (isListening) {
    return;
  }

  if (!recognition) {
    recognition = initSpeechRecognition();
    if (!recognition) {
      throw new Error('Failed to initialize speech recognition');
    }
  }

  isListening = true;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    isListening = false;
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    isListening = false;
    onError?.(new Error(`Speech recognition error: ${event.error}`));
  };

  recognition.onend = () => {
    isListening = false;
  };

  try {
    recognition.start();
    console.log('[VoiceQueries] Started listening...');
  } catch (error) {
    isListening = false;
    throw error;
  }
};

/**
 * Остановить прослушивание
 */
export const stopListening = (): void => {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
    console.log('[VoiceQueries] Stopped listening');
  }
};

/**
 * Выполнение голосового запроса
 */
export const executeVoiceQuery = async (query: string): Promise<any> => {
  if (!AERONAVIGATOR_FEATURES.VOICE_QUERIES) {
    throw new Error('Voice queries are disabled');
  }

  try {
    // Интеграция с Natural Language Query
    const { processQuery } = await import('../ai-ml/NaturalLanguageQuery');
    const result = await processQuery(query);
    
    return result;
  } catch (error) {
    console.error('[VoiceQueries] Error executing query:', error);
    throw error;
  }
};

/**
 * Голосовой запрос с прослушиванием
 */
export const voiceQuery = async (
  onResult?: (result: any) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  await startListening(
    async (query) => {
      try {
        console.log('[VoiceQueries] Recognized:', query);
        const result = await executeVoiceQuery(query);
        onResult?.(result);
      } catch (error) {
        onError?.(error as Error);
      }
    },
    onError
  );
};

/**
 * Инициализация Voice Queries
 */
export const initializeVoiceQueries = async () => {
  if (!AERONAVIGATOR_FEATURES.VOICE_QUERIES) {
    return;
  }

  try {
    // Запрос разрешения на микрофон
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[VoiceQueries] Microphone access granted');
      } catch (error) {
        console.warn('[VoiceQueries] Microphone access denied:', error);
      }
    }

    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.voice) {
        datalens.voice = {
          isAvailable: isVoiceAvailable,
          startListening,
          stopListening,
          query: voiceQuery,
          execute: executeVoiceQuery,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Voice Queries initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Voice Queries:', error);
  }
};

export default initializeVoiceQueries;

