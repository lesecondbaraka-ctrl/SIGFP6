import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PaginationService, PaginatedResponse } from '../services/PaginationService';

interface UsePaginationOptions {
  table: string;
  pageSize?: number;
  initialPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  select?: string;
}

export function usePagination<T>(options: UsePaginationOptions) {
  const {
    table,
    pageSize = 20,
    initialPage = 1,
    sortBy,
    sortOrder = 'desc',
    filters = {},
    select = '*'
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    pageSize,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      // Construire la requête
      let query = supabase
        .from(table)
        .select(select, { count: 'exact' });

      // Appliquer les filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });

      // Appliquer le tri
      if (sortBy) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      // Appliquer la pagination
      const { from, to } = PaginationService.getSupabaseRange(page, pageSize);
      query = query.range(from, to);

      // Exécuter la requête
      const { data: result, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setData(result || []);
      setTotalItems(count || 0);

      const paginationInfo = PaginationService.createPaginatedResponse(
        result || [],
        page,
        pageSize,
        count || 0
      );

      setPagination(paginationInfo.pagination);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
      console.error('Erreur de pagination:', err);
    } finally {
      setLoading(false);
    }
  }, [table, select, sortBy, sortOrder, pageSize, JSON.stringify(filters)]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  }, [pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination.hasNextPage]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [pagination.hasPreviousPage]);

  const refresh = useCallback(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  return {
    data,
    loading,
    error,
    pagination,
    currentPage,
    goToPage,
    nextPage,
    previousPage,
    refresh
  };
}
