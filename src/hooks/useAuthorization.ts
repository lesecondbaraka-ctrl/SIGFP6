import { useAuth } from './useAuth';
import type { Permission, UserRole } from '../types/rbac';
import { PERMISSIONS } from '../types/rbac';

export const useAuthorization = () => {
  const { authState } = useAuth();

  const hasPermission = (
    requiredPermission: Permission,
    userRole: UserRole = authState.user?.role as UserRole
  ): boolean => {
    if (!userRole) return false;

    const rolePermissions = PERMISSIONS[userRole];
    if (!rolePermissions) return false;

    // Vérifier si l'utilisateur a un accès total
    const hasFullAccess = rolePermissions.some(
      permission => permission.action === requiredPermission.action && permission.resource === '*'
    );
    if (hasFullAccess) return true;

    // Vérifier la permission spécifique
    return rolePermissions.some(permission => 
      permission.action === requiredPermission.action && 
      (permission.resource === '*' || permission.resource === requiredPermission.resource)
    );
  };

  const canAccess = (resource: string, action: Permission['action']): boolean => {
    return hasPermission({ action, resource });
  };

  const hasRole = (role: UserRole): boolean => {
    return authState.user?.role === role;
  };

  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  return {
    hasPermission,
    canAccess,
    hasRole,
    isAdmin,
    userRole: authState.user?.role as UserRole
  };
};