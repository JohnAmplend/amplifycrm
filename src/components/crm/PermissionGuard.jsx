import React from 'react';
import usePermissions from './usePermissions';
import { Lock } from 'lucide-react';

/**
 * Permission Guard Component
 * Wraps content that requires specific permissions
 */
export default function PermissionGuard({ 
  module, 
  entity, 
  action, 
  children,
  fallback = null,
  showDenied = false 
}) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const permitted = hasPermission(module, entity, action);

  if (!permitted) {
    if (showDenied) {
      return (
        <div className="ampvibe-card p-6 text-center">
          <Lock className="w-12 h-12 mx-auto mb-3" style={{ color: "#d1d5db" }} />
          <p className="text-sm" style={{ color: "#6b7280" }}>
            You don't have permission to {action} {entity}
          </p>
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}