export type UserRole = 'ADMIN' | 'MANAGER' | 'COMPTABLE' | 'AUDITEUR' | 'LECTEUR';

export interface Permission {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
}

export interface Role {
  name: UserRole;
  permissions: Permission[];
  description: string;
}

export const PERMISSIONS: Record<string, Permission[]> = {
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
    { action: 'DELETE', resource: 'flux_tresorerie' },
    { action: 'CREATE', resource: 'exercices_comptables' },
    { action: 'UPDATE', resource: 'exercices_comptables' }
  ],
  COMPTABLE: [
    { action: 'CREATE', resource: 'flux_tresorerie' },
    { action: 'READ', resource: 'flux_tresorerie' },
    { action: 'UPDATE', resource: 'flux_tresorerie' },
    { action: 'READ', resource: 'exercices_comptables' }
  ],
  AUDITEUR: [
    { action: 'READ', resource: '*' }
  ],
  LECTEUR: [
    { action: 'READ', resource: 'flux_tresorerie' },
    { action: 'READ', resource: 'exercices_comptables' }
  ]
};

export const ROLES: Role[] = [
  {
    name: 'ADMIN',
    permissions: PERMISSIONS.ADMIN,
    description: 'Accès complet à toutes les fonctionnalités'
  },
  {
    name: 'MANAGER',
    permissions: PERMISSIONS.MANAGER,
    description: 'Gestion des flux et des exercices'
  },
  {
    name: 'COMPTABLE',
    permissions: PERMISSIONS.COMPTABLE,
    description: 'Saisie et modification des flux'
  },
  {
    name: 'AUDITEUR',
    permissions: PERMISSIONS.AUDITEUR,
    description: 'Consultation de toutes les données'
  },
  {
    name: 'LECTEUR',
    permissions: PERMISSIONS.LECTEUR,
    description: 'Consultation des flux et exercices'
  }
];