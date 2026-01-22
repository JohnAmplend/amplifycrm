import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function to check user permissions
 * Returns { hasPermission: boolean, user, role }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module, entity, action } = await req.json();

    // Admin always has permission
    if (user.role === 'admin') {
      return Response.json({ 
        hasPermission: true, 
        user, 
        role: { role_name: 'Admin', is_system_role: true } 
      });
    }

    // Check custom role
    let role = null;
    if (user.custom_role_id) {
      role = await base44.asServiceRole.entities.Role.get(user.custom_role_id);
    }

    // If no custom role, use default user permissions
    if (!role) {
      role = {
        role_name: 'User',
        permissions: getDefaultUserPermissions(),
        is_system_role: true
      };
    }

    // Check permission
    const hasPermission = role.permissions?.[module]?.[entity]?.[action] === true;

    return Response.json({ hasPermission, user, role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

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