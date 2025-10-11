export interface Permission {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'COMPTABLE' | 'AUDITEUR' | 'LECTEUR';

export const PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    { action: 'CREATE', resource: '*' },
    { action: 'READ', resource: '*' },
    { action: 'UPDATE', resource: '*' },
    { action: 'DELETE', resource: '*' }
  ],
  MANAGER: [
    { action: 'CREATE', resource: 'flux_tresorerie' },
    { action: 'READ', resource: '*' },
    { action: 'UPDATE', resource: 'flux_tresorerie' },
    { action: 'DELETE', resource: 'flux_tresorerie' }
  ],
  COMPTABLE: [
    { action: 'CREATE', resource: 'flux_tresorerie' },
    { action: 'READ', resource: 'flux_tresorerie' },
    { action: 'UPDATE', resource: 'flux_tresorerie' }
  ],
  AUDITEUR: [
    { action: 'READ', resource: '*' }
  ],
  LECTEUR: [
    { action: 'READ', resource: 'flux_tresorerie' }
  ]
};