import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle } from "lucide-react";
import NeuroCard from "./NeuroCard";

export default function PermissionGuard({ 
  children, 
  permission, 
  fallback = null,
  showMessage = true 
}) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Admin always has all permissions
        if (currentUser.role === 'admin') {
          setHasPermission(true);
          setLoading(false);
          return;
        }

        // Check if user has a custom role assigned
        const assignments = await base44.entities.User_Role_Assignment.filter({ 
          user_email: currentUser.email 
        });

        if (assignments.length > 0) {
          const roleId = assignments[0].role_id;
          const role = await base44.entities.Role.list();
          const userRoleData = role.find(r => r.id === roleId);
          
          if (userRoleData) {
            setUserRole(userRoleData);
            
            // Check permission
            const permitted = checkPermissionInRole(userRoleData.permissions, permission);
            setHasPermission(permitted);
          }
        }
      } catch (error) {
        console.error('Permission check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permission]);

  const checkPermissionInRole = (permissions, permissionPath) => {
    // Permission path format: "crm.contacts.view" or "analytics.view_token_usage"
    const parts = permissionPath.split('.');
    let current = permissions;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }
    
    return current === true;
  };

  if (loading) {
    return null;
  }

  if (!hasPermission) {
    if (fallback) {
      return fallback;
    }
    
    if (!showMessage) {
      return null;
    }

    return (
      <NeuroCard className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#fa8c16" }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
          Access Restricted
        </h2>
        <p style={{ color: "#888" }}>
          You don't have permission to access this feature.
        </p>
      </NeuroCard>
    );
  }

  return <>{children}</>;
}