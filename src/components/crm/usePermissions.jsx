import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook to check user permissions
 * @returns {Object} - { hasPermission, isLoading, user, role }
 */
export default function usePermissions() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Admin users have all permissions
        if (currentUser.role === 'admin') {
          setRole({ 
            role_name: 'Admin', 
            permissions: getAllPermissions(true),
            is_system_role: true
          });
          setIsLoading(false);
          return;
        }

        // Check if user has a custom role
        if (currentUser.custom_role_id) {
          const customRole = await base44.entities.Role.get(currentUser.custom_role_id);
          setRole(customRole);
        } else {
          // Default user role - limited permissions
          setRole({
            role_name: 'User',
            permissions: getDefaultUserPermissions(),
            is_system_role: true
          });
        }
      } catch (error) {
        console.error('Failed to load permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPermissions();
  }, []);

  /**
   * Check if user has a specific permission
   * @param {string} module - e.g., 'crm', 'marketing', 'service'
   * @param {string} entity - e.g., 'contacts', 'campaigns', 'tickets'
   * @param {string} action - e.g., 'view', 'create', 'edit', 'delete', 'export'
   * @returns {boolean}
   */
  const hasPermission = (module, entity, action) => {
    // Admin always has permission
    if (user?.role === 'admin') return true;

    // No role loaded yet
    if (!role?.permissions) return false;

    // Navigate the permissions object
    try {
      const modulePerms = role.permissions[module];
      if (!modulePerms) return false;

      const entityPerms = modulePerms[entity];
      if (!entityPerms) return false;

      return entityPerms[action] === true;
    } catch {
      return false;
    }
  };

  /**
   * Check if user can view all records or only their own
   * @param {string} module - e.g., 'crm'
   * @param {string} entity - e.g., 'contacts'
   * @returns {boolean}
   */
  const canViewAll = (module, entity) => {
    if (user?.role === 'admin') return true;
    if (!role?.permissions) return false;

    try {
      return role.permissions[module]?.[entity]?.view_all === true;
    } catch {
      return false;
    }
  };

  return {
    hasPermission,
    canViewAll,
    isLoading,
    user,
    role
  };
}

// Helper: Get all permissions set to a value
function getAllPermissions(value) {
  return {
    crm: {
      contacts: { view: value, create: value, edit: value, delete: value, export: value, view_all: value },
      companies: { view: value, create: value, edit: value, delete: value, export: value, view_all: value },
      deals: { view: value, create: value, edit: value, delete: value, export: value, view_all: value },
      leads: { view: value, create: value, edit: value, delete: value, export: value, view_all: value },
      activities: { view: value, create: value, edit: value, delete: value },
      tasks: { view: value, create: value, edit: value, delete: value, export: value }
    },
    marketing: {
      campaigns: { view: value, create: value, edit: value, delete: value, send: value },
      templates: { view: value, create: value, edit: value, delete: value },
      lists: { view: value, create: value, edit: value, delete: value },
      forms: { view: value, create: value, edit: value, delete: value }
    },
    service: {
      tickets: { view: value, create: value, edit: value, delete: value, assign: value, view_all: value }
    },
    analytics: {
      reports: { view: value, create: value, edit: value, delete: value, export: value },
      dashboards: { view: value, create: value, edit: value, delete: value }
    },
    settings: {
      manage_users: value,
      manage_roles: value,
      manage_integrations: value,
      view_audit_log: value,
      manage_workflows: value,
      manage_data_quality: value
    },
    data_operations: {
      import: value,
      export: value,
      bulk_edit: value,
      bulk_delete: value
    }
  };
}

// Default permissions for standard users
function getDefaultUserPermissions() {
  return {
    crm: {
      contacts: { view: true, create: true, edit: true, delete: false, export: false, view_all: false },
      companies: { view: true, create: true, edit: true, delete: false, export: false, view_all: false },
      deals: { view: true, create: true, edit: true, delete: false, export: false, view_all: false },
      leads: { view: true, create: true, edit: true, delete: false, export: false, view_all: false },
      activities: { view: true, create: true, edit: true, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false, export: false }
    },
    marketing: {
      campaigns: { view: true, create: false, edit: false, delete: false, send: false },
      templates: { view: true, create: false, edit: false, delete: false },
      lists: { view: true, create: false, edit: false, delete: false },
      forms: { view: true, create: false, edit: false, delete: false }
    },
    service: {
      tickets: { view: true, create: true, edit: true, delete: false, assign: false, view_all: false }
    },
    analytics: {
      reports: { view: true, create: false, edit: false, delete: false, export: false },
      dashboards: { view: true, create: false, edit: false, delete: false }
    },
    settings: {
      manage_users: false,
      manage_roles: false,
      manage_integrations: false,
      view_audit_log: false,
      manage_workflows: false,
      manage_data_quality: false
    },
    data_operations: {
      import: false,
      export: false,
      bulk_edit: false,
      bulk_delete: false
    }
  };
}