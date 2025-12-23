/**
 * Модуль кросс-фильтрации виджетов
 * Виджеты влияют друг на друга через общее состояние фильтров
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Filter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: any;
}

export interface CrossFilterState {
  filters: Record<string, Filter[]>;
  activeWidgets: Set<string>;
}

interface CrossFilterContextType {
  state: CrossFilterState;
  addFilter: (widgetId: string, filter: Filter) => void;
  removeFilter: (widgetId: string, field: string) => void;
  clearFilters: (widgetId: string) => void;
  getFiltersForField: (field: string) => Filter[];
  subscribe: (widgetId: string, callback: (filters: Filter[]) => void) => () => void;
}

const CrossFilterContext = createContext<CrossFilterContextType | null>(null);

/**
 * Провайдер кросс-фильтрации
 */
export const CrossFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CrossFilterState>({
    filters: {},
    activeWidgets: new Set(),
  });
  
  const [subscribers, setSubscribers] = useState<Record<string, Set<(filters: Filter[]) => void>>>({});

  const addFilter = useCallback((widgetId: string, filter: Filter) => {
    setState(prev => {
      const newFilters = { ...prev.filters };
      if (!newFilters[widgetId]) {
        newFilters[widgetId] = [];
      }
      
      // Удалить существующий фильтр для этого поля
      newFilters[widgetId] = newFilters[widgetId].filter(f => f.field !== filter.field);
      newFilters[widgetId].push(filter);
      
      return {
        ...prev,
        filters: newFilters,
        activeWidgets: new Set([...prev.activeWidgets, widgetId]),
      };
    });
    
    // Уведомить подписчиков
    notifySubscribers(widgetId, filter);
  }, []);

  const removeFilter = useCallback((widgetId: string, field: string) => {
    setState(prev => {
      const newFilters = { ...prev.filters };
      if (newFilters[widgetId]) {
        newFilters[widgetId] = newFilters[widgetId].filter(f => f.field !== field);
        if (newFilters[widgetId].length === 0) {
          delete newFilters[widgetId];
        }
      }
      
      return {
        ...prev,
        filters: newFilters,
      };
    });
  }, []);

  const clearFilters = useCallback((widgetId: string) => {
    setState(prev => {
      const newFilters = { ...prev.filters };
      delete newFilters[widgetId];
      
      return {
        ...prev,
        filters: newFilters,
      };
    });
  }, []);

  const getFiltersForField = useCallback((field: string): Filter[] => {
    const allFilters: Filter[] = [];
    Object.values(state.filters).forEach(widgetFilters => {
      widgetFilters.forEach(filter => {
        if (filter.field === field) {
          allFilters.push(filter);
        }
      });
    });
    return allFilters;
  }, [state.filters]);

  const subscribe = useCallback((
    widgetId: string,
    callback: (filters: Filter[]) => void
  ): (() => void) => {
    setSubscribers(prev => {
      const newSubs = { ...prev };
      if (!newSubs[widgetId]) {
        newSubs[widgetId] = new Set();
      }
      newSubs[widgetId].add(callback);
      return newSubs;
    });
    
    return () => {
      setSubscribers(prev => {
        const newSubs = { ...prev };
        if (newSubs[widgetId]) {
          newSubs[widgetId].delete(callback);
          if (newSubs[widgetId].size === 0) {
            delete newSubs[widgetId];
          }
        }
        return newSubs;
      });
    };
  }, []);

  const notifySubscribers = (widgetId: string, filter: Filter) => {
    const widgetSubs = subscribers[widgetId];
    if (widgetSubs) {
      const filters = state.filters[widgetId] || [];
      widgetSubs.forEach(callback => callback(filters));
    }
  };

  const value: CrossFilterContextType = {
    state,
    addFilter,
    removeFilter,
    clearFilters,
    getFiltersForField,
    subscribe,
  };

  return (
    <CrossFilterContext.Provider value={value}>
      {children}
    </CrossFilterContext.Provider>
  );
};

/**
 * Хук для использования кросс-фильтрации
 */
export const useCrossFilter = () => {
  const context = useContext(CrossFilterContext);
  if (!context) {
    throw new Error('useCrossFilter must be used within CrossFilterProvider');
  }
  return context;
};

const CrossFilteringModule: React.FC = () => {
  return null;
};

export default CrossFilteringModule;

