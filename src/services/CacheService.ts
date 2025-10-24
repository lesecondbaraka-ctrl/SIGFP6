/**
 * Service de mise en cache pour améliorer les performances
 * Utilise le localStorage et la mémoire pour le cache
 */

export interface CacheOptions {
  ttl?: number; // Time to live en millisecondes
  prefix?: string;
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static memoryCache: Map<string, CacheEntry<any>> = new Map();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly DEFAULT_PREFIX = 'sigfp_cache_';

  /**
   * Stocke une valeur dans le cache
   */
  static set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): void {
    const {
      ttl = this.DEFAULT_TTL,
      prefix = this.DEFAULT_PREFIX,
      storage = 'memory'
    } = options;

    const cacheKey = prefix + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    switch (storage) {
      case 'memory':
        this.memoryCache.set(cacheKey, entry);
        break;
      case 'localStorage':
        try {
          localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch (error) {
                  }
        break;
      case 'sessionStorage':
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch (error) {
                  }
        break;
    }
  }

  /**
   * Récupère une valeur du cache
   */
  static get<T>(
    key: string,
    options: CacheOptions = {}
  ): T | null {
    const {
      prefix = this.DEFAULT_PREFIX,
      storage = 'memory'
    } = options;

    const cacheKey = prefix + key;
    let entry: CacheEntry<T> | null = null;

    switch (storage) {
      case 'memory':
        entry = this.memoryCache.get(cacheKey) || null;
        break;
      case 'localStorage':
        try {
          const stored = localStorage.getItem(cacheKey);
          if (stored) {
            entry = JSON.parse(stored);
          }
        } catch (error) {
                  }
        break;
      case 'sessionStorage':
        try {
          const stored = sessionStorage.getItem(cacheKey);
          if (stored) {
            entry = JSON.parse(stored);
          }
        } catch (error) {
                  }
        break;
    }

    if (!entry) {
      return null;
    }

    // Vérifier si le cache est expiré
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key, options);
      return null;
    }

    return entry.data;
  }

  /**
   * Supprime une entrée du cache
   */
  static delete(
    key: string,
    options: CacheOptions = {}
  ): void {
    const {
      prefix = this.DEFAULT_PREFIX,
      storage = 'memory'
    } = options;

    const cacheKey = prefix + key;

    switch (storage) {
      case 'memory':
        this.memoryCache.delete(cacheKey);
        break;
      case 'localStorage':
        try {
          localStorage.removeItem(cacheKey);
        } catch (error) {
                  }
        break;
      case 'sessionStorage':
        try {
          sessionStorage.removeItem(cacheKey);
        } catch (error) {
                  }
        break;
    }
  }

  /**
   * Vide tout le cache
   */
  static clear(options: CacheOptions = {}): void {
    const {
      prefix = this.DEFAULT_PREFIX,
      storage = 'memory'
    } = options;

    switch (storage) {
      case 'memory':
        // Supprimer uniquement les entrées avec le bon préfixe
        const keysToDelete: string[] = [];
        this.memoryCache.forEach((_, key) => {
          if (key.startsWith(prefix)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => this.memoryCache.delete(key));
        break;
      case 'localStorage':
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
                  }
        break;
      case 'sessionStorage':
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(prefix)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
        } catch (error) {
                  }
        break;
    }
  }

  /**
   * Vérifie si une clé existe dans le cache et n'est pas expirée
   */
  static has(key: string, options: CacheOptions = {}): boolean {
    return this.get(key, options) !== null;
  }

  /**
   * Récupère ou calcule une valeur (pattern cache-aside)
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Essayer de récupérer du cache
    const cached = this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Sinon, calculer la valeur
    const data = await fetcher();

    // Stocker dans le cache
    this.set(key, data, options);

    return data;
  }

  /**
   * Invalide le cache pour un pattern de clés
   */
  static invalidatePattern(
    pattern: string,
    options: CacheOptions = {}
  ): void {
    const {
      prefix = this.DEFAULT_PREFIX,
      storage = 'memory'
    } = options;

    const fullPattern = prefix + pattern;

    switch (storage) {
      case 'memory':
        const keysToDelete: string[] = [];
        this.memoryCache.forEach((_, key) => {
          if (key.includes(fullPattern)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => this.memoryCache.delete(key));
        break;
      case 'localStorage':
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes(fullPattern)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
                  }
        break;
      case 'sessionStorage':
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.includes(fullPattern)) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
        } catch (error) {
                  }
        break;
    }
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  static cleanExpired(options: CacheOptions = {}): number {
    const {
      prefix = this.DEFAULT_PREFIX,
      storage = 'memory'
    } = options;

    let cleanedCount = 0;
    const now = Date.now();

    switch (storage) {
      case 'memory':
        const keysToDelete: string[] = [];
        this.memoryCache.forEach((entry, key) => {
          if (key.startsWith(prefix) && now - entry.timestamp > entry.ttl) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => {
          this.memoryCache.delete(key);
          cleanedCount++;
        });
        break;
      case 'localStorage':
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
              const stored = localStorage.getItem(key);
              if (stored) {
                const entry: CacheEntry<any> = JSON.parse(stored);
                if (now - entry.timestamp > entry.ttl) {
                  keysToRemove.push(key);
                }
              }
            }
          }
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            cleanedCount++;
          });
        } catch (error) {
                  }
        break;
      case 'sessionStorage':
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(prefix)) {
              const stored = sessionStorage.getItem(key);
              if (stored) {
                const entry: CacheEntry<any> = JSON.parse(stored);
                if (now - entry.timestamp > entry.ttl) {
                  keysToRemove.push(key);
                }
              }
            }
          }
          keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
            cleanedCount++;
          });
        } catch (error) {
                  }
        break;
    }

    return cleanedCount;
  }

  /**
   * Obtient des statistiques sur le cache
   */
  static getStats(options: CacheOptions = {}): {
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
    totalSize: number;
  } {
    const {
      prefix = this.DEFAULT_PREFIX,
      storage = 'memory'
    } = options;

    let totalEntries = 0;
    let expiredEntries = 0;
    let validEntries = 0;
    let totalSize = 0;
    const now = Date.now();

    switch (storage) {
      case 'memory':
        this.memoryCache.forEach((entry, key) => {
          if (key.startsWith(prefix)) {
            totalEntries++;
            totalSize += JSON.stringify(entry).length;
            if (now - entry.timestamp > entry.ttl) {
              expiredEntries++;
            } else {
              validEntries++;
            }
          }
        });
        break;
      case 'localStorage':
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
              const stored = localStorage.getItem(key);
              if (stored) {
                totalEntries++;
                totalSize += stored.length;
                const entry: CacheEntry<any> = JSON.parse(stored);
                if (now - entry.timestamp > entry.ttl) {
                  expiredEntries++;
                } else {
                  validEntries++;
                }
              }
            }
          }
        } catch (error) {
                  }
        break;
      case 'sessionStorage':
        try {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(prefix)) {
              const stored = sessionStorage.getItem(key);
              if (stored) {
                totalEntries++;
                totalSize += stored.length;
                const entry: CacheEntry<any> = JSON.parse(stored);
                if (now - entry.timestamp > entry.ttl) {
                  expiredEntries++;
                } else {
                  validEntries++;
                }
              }
            }
          }
        } catch (error) {
                  }
        break;
    }

    return {
      totalEntries,
      expiredEntries,
      validEntries,
      totalSize
    };
  }

  /**
   * Initialise le nettoyage automatique du cache
   */
  static startAutoCleanup(
    intervalMs: number = 60000, // 1 minute par défaut
    options: CacheOptions = {}
  ): number {
    return window.setInterval(() => {
      const cleaned = this.cleanExpired(options);
      if (cleaned > 0) {
         expirée(s) supprimée(s)`);
      }
    }, intervalMs);
  }

  /**
   * Arrête le nettoyage automatique
   */
  static stopAutoCleanup(intervalId: number): void {
    clearInterval(intervalId);
  }
}

// Initialiser le nettoyage automatique au démarrage
if (typeof window !== 'undefined') {
  CacheService.startAutoCleanup();
}
