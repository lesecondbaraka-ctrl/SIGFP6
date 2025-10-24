/**
 * Service de pagination pour optimiser les performances
 * Implémente la pagination côté serveur avec Supabase
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class PaginationService {
  /**
   * Calcule les paramètres de pagination
   */
  static calculatePagination(
    page: number,
    pageSize: number,
    totalItems: number
  ): {
    from: number;
    to: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } {
    const totalPages = Math.ceil(totalItems / pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return {
      from,
      to,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }

  /**
   * Crée une réponse paginée
   */
  static createPaginatedResponse<T>(
    data: T[],
    page: number,
    pageSize: number,
    totalItems: number
  ): PaginatedResponse<T> {
    const pagination = this.calculatePagination(page, pageSize, totalItems);

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.hasNextPage,
        hasPreviousPage: pagination.hasPreviousPage
      }
    };
  }

  /**
   * Valide les paramètres de pagination
   */
  static validateParams(params: PaginationParams): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (params.page < 1) {
      errors.push('Le numéro de page doit être supérieur ou égal à 1');
    }

    if (params.pageSize < 1) {
      errors.push('La taille de page doit être supérieure ou égale à 1');
    }

    if (params.pageSize > 1000) {
      errors.push('La taille de page ne peut pas dépasser 1000');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Génère les paramètres de requête Supabase
   */
  static getSupabaseRange(page: number, pageSize: number): { from: number; to: number } {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }
}
