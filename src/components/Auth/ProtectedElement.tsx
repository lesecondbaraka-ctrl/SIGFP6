import React from 'react';
import { useAuthorization } from '../../hooks/useAuthorization';
import { Permission } from '../../types/auth';

interface ProtectedElementProps {
  children: React.ReactNode;
  requiredPermissions: Permission[];
  fallback?: React.ReactNode;
}

const ProtectedElement: React.FC<ProtectedElementProps> = ({
  children,
  requiredPermissions,
  fallback = null
}) => {
  const { hasPermission, userRole } = useAuthorization();

  const hasAccess = requiredPermissions.every(permission =>
    hasPermission(permission, userRole)
  );

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedElement;