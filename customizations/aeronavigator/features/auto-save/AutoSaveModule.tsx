/**
 * Модуль автосохранения
 * Автоматическое сохранение изменений с индикатором статуса
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AUTO_SAVE_CONFIG } from '../../config';

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

export interface AutoSaveOptions {
  interval?: number;
  showIndicator?: boolean;
  restoreOnLoad?: boolean;
}

/**
 * Хук для автосохранения
 */
export const useAutoSave = <T>(
  saveFunction: (data: T) => Promise<void>,
  data: T,
  options: AutoSaveOptions = {}
) => {
  const {
    interval = AUTO_SAVE_CONFIG.interval,
    showIndicator = AUTO_SAVE_CONFIG.showIndicator,
    restoreOnLoad = AUTO_SAVE_CONFIG.restoreOnLoad,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T | null>(null);

  const save = useCallback(async () => {
    if (state.isSaving) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      await saveFunction(data);
      lastSavedDataRef.current = data;
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Ошибка сохранения',
      }));
    }
  }, [data, saveFunction, state.isSaving]);

  useEffect(() => {
    // Проверка изменений
    const hasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current);
    
    if (hasChanges && !state.isSaving) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));

      // Очистить предыдущий таймер
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Установить новый таймер
      saveTimeoutRef.current = setTimeout(() => {
        save();
      }, interval * 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, interval, save, state.isSaving]);

  // Восстановление при загрузке
  useEffect(() => {
    if (restoreOnLoad) {
      const savedData = localStorage.getItem('autosave-backup');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Восстановить данные (нужно реализовать логику восстановления)
          console.log('Restoring unsaved changes:', parsed);
        } catch (error) {
          console.error('Error restoring data:', error);
        }
      }
    }
  }, [restoreOnLoad]);

  // Сохранение в localStorage как бэкап
  useEffect(() => {
    if (state.hasUnsavedChanges) {
      localStorage.setItem('autosave-backup', JSON.stringify(data));
    }
  }, [data, state.hasUnsavedChanges]);

  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    save();
  }, [save]);

  return {
    ...state,
    forceSave,
    showIndicator,
  };
};

/**
 * Компонент индикатора автосохранения
 */
export const AutoSaveIndicator: React.FC<{ state: AutoSaveState }> = ({ state }) => {
  if (!state.hasUnsavedChanges && !state.isSaving) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 16px',
        backgroundColor: state.isSaving ? '#f0f0f0' : '#fff3cd',
        border: `1px solid ${state.isSaving ? '#ccc' : '#ffc107'}`,
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000,
      }}
    >
      {state.isSaving ? (
        <>💾 Сохранение...</>
      ) : state.hasUnsavedChanges ? (
        <>⚠️ Есть несохраненные изменения</>
      ) : state.lastSaved ? (
        <>✓ Сохранено {state.lastSaved.toLocaleTimeString()}</>
      ) : null}
      {state.error && (
        <div style={{ color: 'red', marginTop: '4px' }}>Ошибка: {state.error}</div>
      )}
    </div>
  );
};

const AutoSaveModule: React.FC = () => {
  return null;
};

export default AutoSaveModule;

