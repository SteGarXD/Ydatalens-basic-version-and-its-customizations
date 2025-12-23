/**
 * Модуль полнотекстового поиска
 * Поиск по всем объектам (дашборды, чарты, датасеты)
 */

import React, { useState, useCallback } from 'react';

export interface SearchResult {
  id: string;
  type: 'dashboard' | 'chart' | 'dataset';
  name: string;
  description?: string;
  relevance: number;
  highlights?: string[];
}

export interface SearchOptions {
  types?: ('dashboard' | 'chart' | 'dataset')[];
  limit?: number;
  offset?: number;
}

/**
 * Выполнить поиск
 */
export const search = async (
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> => {
  try {
    const params = new URLSearchParams({
      q: query,
      ...(options.types && { types: options.types.join(',') }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.offset && { offset: options.offset.toString() }),
    });

    const response = await fetch(`/api/v1/search?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching:', error);
    throw error;
  }
};

/**
 * Хук для быстрого поиска (Ctrl+K)
 */
export const useQuickSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await search(searchQuery, { limit: 10 });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    search: performSearch,
  };
};

const SearchModule: React.FC = () => {
  return null;
};

export default SearchModule;

