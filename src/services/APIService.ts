import { supabase } from '../lib/supabase';
import { AuditTrailService } from './AuditTrailService';

/**
 * Service API REST pour intégrations externes
 * Conforme aux standards OpenAPI/Swagger
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requiresAuth: boolean;
  permissions?: string[];
  rateLimit?: {
    requests: number;
    window: number; // en secondes
  };
}

export class APIService {
  private static readonly API_VERSION = 'v1';
  private static readonly BASE_PATH = '/api';

  /**
   * Liste des endpoints disponibles
   */
  static readonly ENDPOINTS: APIEndpoint[] = [
    {
      path: '/budget',
      method: 'GET',
      description: 'Récupère la liste des postes budgétaires',
      requiresAuth: true,
      permissions: ['GESTION_BUDGET']
    },
    {
      path: '/budget/:id',
      method: 'GET',
      description: 'Récupère un poste budgétaire spécifique',
      requiresAuth: true,
      permissions: ['GESTION_BUDGET']
    },
    {
      path: '/budget',
      method: 'POST',
      description: 'Crée un nouveau poste budgétaire',
      requiresAuth: true,
      permissions: ['GESTION_BUDGET']
    },
    {
      path: '/depenses',
      method: 'GET',
      description: 'Récupère la liste des dépenses',
      requiresAuth: true,
      permissions: ['GESTION_DEPENSES']
    },
    {
      path: '/recettes',
      method: 'GET',
      description: 'Récupère la liste des recettes',
      requiresAuth: true,
      permissions: ['GESTION_RECETTES']
    },
    {
      path: '/tresorerie/flux',
      method: 'GET',
      description: 'Récupère les flux de trésorerie',
      requiresAuth: true,
      permissions: ['GESTION_TRESORERIE']
    },
    {
      path: '/etats-financiers/bilan',
      method: 'GET',
      description: 'Génère le bilan',
      requiresAuth: true,
      permissions: ['CONSULTATION_ETATS']
    },
    {
      path: '/etats-financiers/compte-resultat',
      method: 'GET',
      description: 'Génère le compte de résultat',
      requiresAuth: true,
      permissions: ['CONSULTATION_ETATS']
    },
    {
      path: '/rapports/tofe',
      method: 'GET',
      description: 'Génère le TOFE',
      requiresAuth: true,
      permissions: ['GENERATION_RAPPORTS']
    },
    {
      path: '/audit/logs',
      method: 'GET',
      description: 'Récupère les logs d\'audit',
      requiresAuth: true,
      permissions: ['CONSULTATION_AUDIT']
    }
  ];

  /**
   * Génère la documentation OpenAPI/Swagger
   */
  static generateOpenAPISpec(): any {
    return {
      openapi: '3.0.0',
      info: {
        title: 'SIGFP API',
        version: this.API_VERSION,
        description: 'API REST pour le Système Intégré de Gestion Financière Publique',
        contact: {
          name: 'Support SIGFP',
          email: 'support@sigfp.cd'
        },
        license: {
          name: 'Proprietary'
        }
      },
      servers: [
        {
          url: `${this.BASE_PATH}/${this.API_VERSION}`,
          description: 'Serveur de production'
        }
      ],
      paths: this.generatePaths(),
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        },
        schemas: this.generateSchemas()
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    };
  }

  /**
   * Génère les chemins de l'API
   */
  private static generatePaths(): any {
    const paths: any = {};

    this.ENDPOINTS.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        tags: [this.getTagFromPath(endpoint.path)],
        security: endpoint.requiresAuth ? [{ bearerAuth: [] }] : [],
        responses: {
          '200': {
            description: 'Succès',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/APIResponse'
                }
              }
            }
          },
          '400': {
            description: 'Requête invalide'
          },
          '401': {
            description: 'Non authentifié'
          },
          '403': {
            description: 'Non autorisé'
          },
          '404': {
            description: 'Ressource non trouvée'
          },
          '500': {
            description: 'Erreur serveur'
          }
        }
      };
    });

    return paths;
  }

  /**
   * Génère les schémas de données
   */
  private static generateSchemas(): any {
    return {
      APIResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indique si la requête a réussi'
          },
          data: {
            type: 'object',
            description: 'Données de la réponse'
          },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          },
          metadata: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string' },
              requestId: { type: 'string' }
            }
          }
        }
      },
      BudgetItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code_budget: { type: 'string' },
          libelle: { type: 'string' },
          montant_alloue: { type: 'number' },
          montant_execute: { type: 'number' },
          exercice_id: { type: 'string', format: 'uuid' },
          entite_id: { type: 'string', format: 'uuid' }
        }
      },
      Depense: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          numero_depense: { type: 'string' },
          libelle: { type: 'string' },
          montant: { type: 'number' },
          date_depense: { type: 'string', format: 'date' },
          statut: { type: 'string', enum: ['En attente', 'Validé', 'Payé', 'Rejeté'] },
          beneficiaire: { type: 'string' }
        }
      },
      Recette: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          numero_recette: { type: 'string' },
          libelle: { type: 'string' },
          montant: { type: 'number' },
          date_recette: { type: 'string', format: 'date' },
          statut: { type: 'string', enum: ['En attente', 'Encaissé', 'Annulé'] },
          type_recette: { type: 'string' }
        }
      }
    };
  }

  /**
   * Extrait le tag depuis le chemin
   */
  private static getTagFromPath(path: string): string {
    const parts = path.split('/').filter(p => p && !p.startsWith(':'));
    return parts[0] || 'general';
  }

  /**
   * Crée une réponse API standardisée
   */
  static createResponse<T>(
    success: boolean,
    data?: T,
    error?: { code: string; message: string; details?: any }
  ): APIResponse<T> {
    return {
      success,
      data,
      error,
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.API_VERSION
      }
    };
  }

  /**
   * Gère une requête API avec logging
   */
  static async handleRequest<T>(
    endpoint: string,
    method: string,
    handler: () => Promise<T>,
    userId?: string,
    userName?: string,
    userRole?: string,
    userEntity?: string
  ): Promise<APIResponse<T>> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Logger la requête
      if (userId && userName && userRole && userEntity) {
        await AuditTrailService.log({
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          user_entity: userEntity,
          action_type: 'DATA_EXPORT',
          resource_type: 'api',
          resource_id: endpoint,
          operation: method as any,
          severity: 'LOW',
          status: 'SUCCESS',
          metadata: {
            endpoint,
            method,
            requestId
          }
        });
      }

      // Exécuter le handler
      const data = await handler();

      return {
        ...this.createResponse(true, data),
        metadata: {
          timestamp: new Date().toISOString(),
          version: this.API_VERSION,
          requestId
        }
      };
    } catch (error: any) {
      console.error(`Erreur API ${endpoint}:`, error);

      // Logger l'erreur
      if (userId && userName && userRole && userEntity) {
        await AuditTrailService.log({
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          user_entity: userEntity,
          action_type: 'SYSTEM_ERROR',
          resource_type: 'api',
          resource_id: endpoint,
          operation: method as any,
          severity: 'HIGH',
          status: 'FAILURE',
          error_message: error.message,
          metadata: {
            endpoint,
            method,
            requestId
          }
        });
      }

      return {
        ...this.createResponse(false, undefined, {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Une erreur est survenue',
          details: error
        }),
        metadata: {
          timestamp: new Date().toISOString(),
          version: this.API_VERSION,
          requestId
        }
      };
    }
  }

  /**
   * Webhook pour notifications externes
   */
  static async sendWebhook(
    url: string,
    event: string,
    data: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SIGFP-Event': event,
          'X-SIGFP-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erreur webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Valide un token API
   */
  static async validateAPIToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    permissions?: string[];
  }> {
    try {
      // Vérifier le token dans la base de données
      const { data, error } = await supabase
        .from('api_tokens')
        .select('*, utilisateurs(*)')
        .eq('token', token)
        .eq('actif', true)
        .single();

      if (error || !data) {
        return { valid: false };
      }

      // Vérifier l'expiration
      if (data.date_expiration && new Date(data.date_expiration) < new Date()) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: data.id_utilisateur,
        permissions: data.permissions || []
      };
    } catch (error) {
      console.error('Erreur validation token:', error);
      return { valid: false };
    }
  }

  /**
   * Génère un nouveau token API
   */
  static async generateAPIToken(
    userId: string,
    name: string,
    permissions: string[],
    expiresInDays?: number
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const token = `sigfp_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
      
      const expirationDate = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const { error } = await supabase
        .from('api_tokens')
        .insert([{
          token,
          id_utilisateur: userId,
          nom: name,
          permissions,
          date_expiration: expirationDate?.toISOString(),
          actif: true,
          date_creation: new Date().toISOString()
        }]);

      if (error) throw error;

      return { success: true, token };
    } catch (error: any) {
      console.error('Erreur génération token:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Révoque un token API
   */
  static async revokeAPIToken(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('api_tokens')
        .update({ actif: false })
        .eq('token', token);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Erreur révocation token:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
