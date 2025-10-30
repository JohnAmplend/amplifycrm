import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Edit, Trash2, Check, X, Lock, Unlock, Eye, PenTool, Save } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function RolesPermissions() {
  const queryClient = useQueryClient();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [roleData, setRoleData] = useState({
    role_name: "",
    description: "",
    permissions: {
      // CRM Module
      crm_contacts_view: false,
      crm_contacts_create: false,
      crm_contacts_edit: false,
      crm_contacts_delete: false,
      crm_companies_view: false,
      crm_companies_create: false,
      crm_companies_edit: false,
      crm_companies_delete: false,
      crm_deals_view: false,
      crm_deals_create: false,
      crm_deals_edit: false,
      crm_deals_delete: false,
      crm_leads_view: false,
      crm_leads_create: false,
      crm_leads_edit: false,
      crm_leads_delete: false,
      
      // Marketing Module
      marketing_campaigns_view: false,
      marketing_campaigns_create: false,
      marketing_campaigns_edit: false,
      marketing_campaigns_delete: false,
      marketing_campaigns_send: false,
      marketing_templates_view: false,
      marketing_templates_create: false,
      marketing_templates_edit: false,
      marketing_lists_view: false,
      marketing_lists_create: false,
      marketing_lists_edit: false,
      marketing_forms_view: false,
      marketing_forms_create: false,
      marketing_forms_edit: false,
      
      // Service Module
      service_tickets_view: false,
      service_tickets_create: false,
      service_tickets_edit: false,
      service_tickets_delete: false,
      service_tickets_assign: false,
      
      // Reporting Module
      reports_view: false,
      reports_create: false,
      reports_edit: false,
      reports_delete: false,
      reports_export: false,
      dashboards_view: false,
      dashboards_create: false,
      dashboards_edit: false,
      
      // Settings Module
      settings_general: false,
      settings_users: false,
      settings_roles: false,
      settings_integrations: false,
      settings_api_keys: false,
      settings_payment_gateways: false,
      settings_data_enrichment: false,
      
      // Advanced
      workflows_view: false,
      workflows_create: false,
      workflows_edit: false,
      import_data: false,
      export_data: false,
      bulk_operations: false
    }
  });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: roles = [] } = useQuery({
    queryKey: ['custom-roles'],
    queryFn: async () => {
      // Use Custom_Object_Records to store roles
      const records = await base44.entities.Custom_Object_Records.list();
      return records.filter(r => r.record_data?.type === 'role');
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const roleObject = await base44.entities.Custom_Objects.filter({ object_name: 'Role' });
      const objectId = roleObject[0]?.id;

      if (!objectId) {
        throw new Error('Role object not found');
      }

      const recordData = {
        object_id: objectId,
        record_name: data.role_name,
        record_data: {
          type: 'role',
          description: data.description,
          permissions: data.permissions
        }
      };

      if (editingRole) {
        return base44.entities.Custom_Object_Records.update(editingRole.id, recordData);
      }
      return base44.entities.Custom_Object_Records.create(recordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-roles']);
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleData({
        role_name: "",
        description: "",
        permissions: Object.fromEntries(Object.keys(roleData.permissions).map(k => [k, false]))
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Custom_Object_Records.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom-roles']);
    }
  });

  const openEditModal = (role) => {
    setEditingRole(role);
    setRoleData({
      role_name: role.record_name,
      description: role.record_data.description,
      permissions: role.record_data.permissions
    });
    setShowRoleModal(true);
  };

  const togglePermission = (key) => {
    setRoleData({
      ...roleData,
      permissions: {
        ...roleData.permissions,
        [key]: !roleData.permissions[key]
      }
    });
  };

  const setModulePermissions = (module, value) => {
    const moduleKeys = Object.keys(roleData.permissions).filter(k => k.startsWith(module));
    const updates = {};
    moduleKeys.forEach(k => updates[k] = value);
    setRoleData({
      ...roleData,
      permissions: {
        ...roleData.permissions,
        ...updates
      }
    });
  };

  const permissionModules = {
    'CRM': [
      { group: 'Contacts', prefix: 'crm_contacts_' },
      { group: 'Companies', prefix: 'crm_companies_' },
      { group: 'Deals', prefix: 'crm_deals_' },
      { group: 'Leads', prefix: 'crm_leads_' }
    ],
    'Marketing': [
      { group: 'Campaigns', prefix: 'marketing_campaigns_', extra: ['send'] },
      { group: 'Templates', prefix: 'marketing_templates_' },
      { group: 'Lists', prefix: 'marketing_lists_' },
      { group: 'Forms', prefix: 'marketing_forms_' }
    ],
    'Service': [
      { group: 'Tickets', prefix: 'service_tickets_', extra: ['assign'] }
    ],
    'Reporting': [
      { group: 'Reports', prefix: 'reports_', extra: ['export'] },
      { group: 'Dashboards', prefix: 'dashboards_' }
    ],
    'Settings': [
      { group: 'General Settings', key: 'settings_general' },
      { group: 'User Management', key: 'settings_users' },
      { group: 'Roles & Permissions', key: 'settings_roles' },
      { group: 'Integrations', key: 'settings_integrations' },
      { group: 'API Keys', key: 'settings_api_keys' },
      { group: 'Payment Gateways', key: 'settings_payment_gateways' },
      { group: 'Data Enrichment', key: 'settings_data_enrichment' }
    ],
    'Advanced': [
      { group: 'Workflows', prefix: 'workflows_' },
      { group: 'Import Data', key: 'import_data' },
      { group: 'Export Data', key: 'export_data' },
      { group: 'Bulk Operations', key: 'bulk_operations' }
    ]
  };

  const getPermissionCount = (role) => {
    const perms = role.record_data.permissions || {};
    return Object.values(perms).filter(Boolean).length;
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-8">
        <NeuroCard className="p-12 text-center">
          <Lock className="w-16 h-16 mx-auto mb-4" style={{ color: "#d1d5db" }} />
          <p className="text-lg font-medium mb-2" style={{ color: "#6b7280" }}>
            Access Denied
          </p>
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            Only administrators can manage roles and permissions
          </p>
        </NeuroCard>
      </div>
    );
  }

  return (
    <div className="p-8" style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>Roles & Permissions</h1>
            <p style={{ color: "#6b7280" }}>Define custom roles and access controls</p>
          </div>
          <NeuroButton variant="primary" onClick={() => {
            setEditingRole(null);
            setRoleData({
              role_name: "",
              description: "",
              permissions: Object.fromEntries(Object.keys(roleData.permissions).map(k => [k, false]))
            });
            setShowRoleModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </NeuroButton>
        </div>

        {/* Roles List */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {roles.map((role) => (
            <NeuroCard key={role.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="ampvibe-inset p-2 rounded-lg">
                    <Shield className="w-6 h-6" style={{ color: "#0066cc" }} />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: "#111827" }}>{role.record_name}</h3>
                    <p className="text-xs" style={{ color: "#6b7280" }}>
                      {getPermissionCount(role)} permissions
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(role)} className="ampvibe-button p-2">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(role.id)} className="ampvibe-button p-2 hover:bg-red-50" style={{ color: "#dc2626" }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                {role.record_data.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "#9ca3af" }}>
                  {users.filter(u => u.custom_role_id === role.id).length} users
                </span>
                <span className="px-2 py-1 rounded-full" style={{ background: '#e6f7ff', color: "#0066cc" }}>
                  Custom Role
                </span>
              </div>
            </NeuroCard>
          ))}
        </div>

        {/* Default Roles Info */}
        <NeuroCard className="p-6">
          <h3 className="font-bold mb-4" style={{ color: "#111827" }}>Default System Roles</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5" style={{ color: "#52c41a" }} />
                <h4 className="font-bold" style={{ color: "#111827" }}>Admin</h4>
              </div>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Full access to all modules and settings. Cannot be modified.
              </p>
            </div>
            <div className="p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5" style={{ color: "#0066cc" }} />
                <h4 className="font-bold" style={{ color: "#111827" }}>User</h4>
              </div>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Limited access to CRM and basic features. Cannot access settings.
              </p>
            </div>
          </div>
        </NeuroCard>
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>
                    {editingRole ? 'Edit Role' : 'Create Role'}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                    Define permissions for this role
                  </p>
                </div>
                <button onClick={() => setShowRoleModal(false)} className="ampvibe-button p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Basic Info */}
              <div className="mb-6">
                <NeuroInput
                  label="Role Name"
                  value={roleData.role_name}
                  onChange={(e) => setRoleData({ ...roleData, role_name: e.target.value })}
                  placeholder="e.g., Sales Manager"
                  required
                  className="mb-4"
                />
                <NeuroInput
                  label="Description"
                  value={roleData.description}
                  onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
                  placeholder="What can this role do?"
                />
              </div>

              {/* Permissions */}
              <div className="space-y-6">
                {Object.entries(permissionModules).map(([moduleName, groups]) => (
                  <div key={moduleName} className="p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold" style={{ color: "#111827" }}>{moduleName}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModulePermissions(moduleName.toLowerCase(), true)}
                          className="text-xs px-3 py-1 rounded hover:bg-green-50"
                          style={{ color: "#52c41a" }}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setModulePermissions(moduleName.toLowerCase(), false)}
                          className="text-xs px-3 py-1 rounded hover:bg-red-50"
                          style={{ color: "#dc2626" }}
                        >
                          None
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {groups.map((group) => {
                        if (group.key) {
                          // Single permission
                          return (
                            <label key={group.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                checked={roleData.permissions[group.key]}
                                onChange={() => togglePermission(group.key)}
                                className="w-4 h-4 rounded"
                                style={{ accentColor: "#0066cc" }}
                              />
                              <span className="text-sm font-medium" style={{ color: "#374151" }}>
                                {group.group}
                              </span>
                            </label>
                          );
                        } else {
                          // Permission group with CRUD
                          const actions = ['view', 'create', 'edit', 'delete', ...(group.extra || [])];
                          return (
                            <div key={group.prefix} className="pl-4">
                              <p className="text-sm font-medium mb-2" style={{ color: "#6b7280" }}>
                                {group.group}
                              </p>
                              <div className="grid grid-cols-5 gap-2">
                                {actions.map((action) => {
                                  const key = `${group.prefix}${action}`;
                                  return (
                                    <label key={key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                                      <input
                                        type="checkbox"
                                        checked={roleData.permissions[key]}
                                        onChange={() => togglePermission(key)}
                                        className="w-4 h-4 rounded"
                                        style={{ accentColor: "#0066cc" }}
                                      />
                                      <span className="text-xs capitalize" style={{ color: "#374151" }}>
                                        {action}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-between" style={{ borderColor: "#e5e7eb" }}>
              <NeuroButton onClick={() => setShowRoleModal(false)}>
                Cancel
              </NeuroButton>
              <NeuroButton
                variant="primary"
                onClick={() => saveMutation.mutate(roleData)}
                disabled={!roleData.role_name || saveMutation.isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingRole ? 'Update Role' : 'Create Role'}
              </NeuroButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}