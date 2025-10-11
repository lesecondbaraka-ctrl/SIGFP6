import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthorization } from '../../hooks/useAuthorization';
import { Permission } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = []
}) => {
  const { hasPermission, userRole } = useAuthorization();

  // Vérifier toutes les permissions requises
  const hasAllPermissions = requiredPermissions.length === 0 || 
    requiredPermissions.every(permission => hasPermission(permission, userRole));

  if (!hasAllPermissions) {
    // Rediriger vers la page d'accès refusé
    return <Navigate to="/acces-refuse" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;