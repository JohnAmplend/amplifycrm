import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Edit, Trash2, Check, X, Lock, Unlock, Eye, PenTool, Save, Sparkles } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import RoleTemplates from "../components/crm/RoleTemplates";
import { toast } from "../components/crm/useToast";

export default function RolesPermissions() {
  const queryClient = useQueryClient();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [roleData, setRoleData] = useState({
    role_name: "",
    description: "",
    permissions: {}
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    enabled: !!currentUser && currentUser.role === 'admin'
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser && currentUser.role === 'admin'
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }) => {
      return base44.entities.User.update(userId, { custom_role_id: roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowAssignModal(false);
      setSelectedUser(null);
      toast.success('Role assigned successfully');
    },
    onError: (error) => {
      toast.error('Failed to assign role: ' + error.message);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingRole) {
        return base44.entities.Role.update(editingRole.id, data);
      }
      return base44.entities.Role.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setShowRoleModal(false);
      setEditingRole(null);
      setRoleData({
        role_name: "",
        description: "",
        permissions: {}
      });
      toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
    },
    onError: (error) => {
      toast.error('Failed to save role: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete role: ' + error.message);
    }
  });

  const openEditModal = (role) => {
    setEditingRole(role);
    setRoleData({
      role_name: role.role_name,
      description: role.description,
      permissions: role.permissions || {}
    });
    setShowRoleModal(true);
  };

  const togglePermission = (module, entity, action) => {
    const newPerms = { ...roleData.permissions };
    if (!newPerms[module]) newPerms[module] = {};
    if (!newPerms[module][entity]) newPerms[module][entity] = {};
    newPerms[module][entity][action] = !newPerms[module][entity][action];
    setRoleData({ ...roleData, permissions: newPerms });
  };

  const setAllEntityPermissions = (module, entity, value) => {
    const newPerms = { ...roleData.permissions };
    if (!newPerms[module]) newPerms[module] = {};
    newPerms[module][entity] = {
      view: value,
      create: value,
      edit: value,
      delete: value,
      export: value,
      ...(entity === 'contacts' || entity === 'companies' || entity === 'deals' || entity === 'leads' || entity === 'tickets' ? { view_all: value } : {}),
      ...(entity === 'campaigns' ? { send: value } : {}),
      ...(entity === 'tickets' ? { assign: value } : {})
    };
    setRoleData({ ...roleData, permissions: newPerms });
  };

  const getPermissionValue = (module, entity, action) => {
    return roleData.permissions?.[module]?.[entity]?.[action] || false;
  };

  const permissionModules = {
    'CRM': {
      module: 'crm',
      entities: [
        { name: 'Contacts', key: 'contacts', actions: ['view', 'create', 'edit', 'delete', 'export', 'view_all'] },
        { name: 'Companies', key: 'companies', actions: ['view', 'create', 'edit', 'delete', 'export', 'view_all'] },
        { name: 'Deals', key: 'deals', actions: ['view', 'create', 'edit', 'delete', 'export', 'view_all'] },
        { name: 'Leads', key: 'leads', actions: ['view', 'create', 'edit', 'delete', 'export', 'view_all'] },
        { name: 'Activities', key: 'activities', actions: ['view', 'create', 'edit', 'delete'] },
        { name: 'Tasks', key: 'tasks', actions: ['view', 'create', 'edit', 'delete', 'export'] }
      ]
    },
    'Marketing': {
      module: 'marketing',
      entities: [
        { name: 'Campaigns', key: 'campaigns', actions: ['view', 'create', 'edit', 'delete', 'send'] },
        { name: 'Templates', key: 'templates', actions: ['view', 'create', 'edit', 'delete'] },
        { name: 'Lists', key: 'lists', actions: ['view', 'create', 'edit', 'delete'] },
        { name: 'Forms', key: 'forms', actions: ['view', 'create', 'edit', 'delete'] }
      ]
    },
    'Service': {
      module: 'service',
      entities: [
        { name: 'Tickets', key: 'tickets', actions: ['view', 'create', 'edit', 'delete', 'assign', 'view_all'] }
      ]
    },
    'Analytics': {
      module: 'analytics',
      entities: [
        { name: 'Reports', key: 'reports', actions: ['view', 'create', 'edit', 'delete', 'export'] },
        { name: 'Dashboards', key: 'dashboards', actions: ['view', 'create', 'edit', 'delete'] }
      ]
    },
    'Data Operations': {
      module: 'data_operations',
      entities: [
        { name: 'Import', key: 'import', actions: ['allowed'] },
        { name: 'Export', key: 'export', actions: ['allowed'] },
        { name: 'Bulk Edit', key: 'bulk_edit', actions: ['allowed'] },
        { name: 'Bulk Delete', key: 'bulk_delete', actions: ['allowed'] }
      ]
    },
    'Settings': {
      module: 'settings',
      entities: [
        { name: 'Manage Users', key: 'manage_users', actions: ['allowed'] },
        { name: 'Manage Roles', key: 'manage_roles', actions: ['allowed'] },
        { name: 'Manage Integrations', key: 'manage_integrations', actions: ['allowed'] },
        { name: 'View Audit Log', key: 'view_audit_log', actions: ['allowed'] },
        { name: 'Manage Workflows', key: 'manage_workflows', actions: ['allowed'] },
        { name: 'Data Quality', key: 'manage_data_quality', actions: ['allowed'] }
      ]
    }
  };

  const getPermissionCount = (role) => {
    let count = 0;
    const countObj = (obj) => {
      Object.values(obj || {}).forEach(val => {
        if (typeof val === 'boolean') count += val ? 1 : 0;
        else if (typeof val === 'object') countObj(val);
      });
    };
    countObj(role.permissions);
    return count;
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {roles.map((role) => (
            <NeuroCard key={role.id} className="p-6 hover:scale-105 transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="ampvibe-inset p-2 rounded-lg">
                    <Shield className="w-6 h-6" style={{ color: "#0066cc" }} />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: "#111827" }}>{role.role_name}</h3>
                    <p className="text-xs" style={{ color: "#6b7280" }}>
                      {getPermissionCount(role)} permissions
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(role)} className="ampvibe-button p-2">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Delete role "${role.role_name}"?`)) {
                        deleteMutation.mutate(role.id);
                      }
                    }} 
                    className="ampvibe-button p-2 hover:bg-red-50" 
                    style={{ color: "#dc2626" }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                {role.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "#9ca3af" }}>
                  {users.filter(u => u.custom_role_id === role.id).length} users assigned
                </span>
                <span className="px-2 py-1 rounded-full" style={{ background: '#e6f7ff', color: "#0066cc" }}>
                  Custom
                </span>
              </div>
            </NeuroCard>
          ))}
        </div>

        {/* User Role Assignments */}
        <NeuroCard className="mb-6">
          <h3 className="font-bold mb-4 text-lg" style={{ color: "#111827" }}>User Role Assignments</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "#e5e7eb" }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "#6b7280" }}>User</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "#6b7280" }}>Email</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "#6b7280" }}>System Role</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "#6b7280" }}>Custom Role</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "#6b7280" }}>Status</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: "#6b7280" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const customRole = roles.find(r => r.id === u.custom_role_id);
                  return (
                    <tr key={u.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#f3f4f6" }}>
                      <td className="py-3 px-4 font-medium" style={{ color: "#374151" }}>
                        {u.full_name}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#6b7280" }}>
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          u.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {customRole ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            {customRole.role_name}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                       {u.is_frozen ? (
                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                           <Lock className="w-3 h-3" />
                           Frozen
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                           <Unlock className="w-3 h-3" />
                           Active
                         </span>
                       )}
                      </td>
                      <td className="py-3 px-4">
                       <NeuroButton 
                         size="sm"
                         onClick={() => {
                           setSelectedUser(u);
                           setShowAssignModal(true);
                         }}
                       >
                         Assign Role
                       </NeuroButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </NeuroCard>

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

              {/* Role Templates */}
              {!editingRole && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="ampvibe-button px-4 py-2 flex items-center gap-2 mb-3"
                  >
                    <Sparkles className="w-4 h-4" />
                    {showTemplates ? 'Hide Templates' : 'Use Template'}
                  </button>
                  
                  {showTemplates && (
                    <RoleTemplates 
                      onSelectTemplate={(template) => {
                        setRoleData({
                          ...roleData,
                          role_name: template.name,
                          description: template.description,
                          permissions: template.permissions
                        });
                        setShowTemplates(false);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Permissions */}
              <div className="space-y-6">
                {Object.entries(permissionModules).map(([moduleName, config]) => (
                  <div key={moduleName} className="p-4 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                    <h3 className="font-bold mb-4 text-lg" style={{ color: "#111827" }}>{moduleName}</h3>

                    <div className="space-y-4">
                      {config.entities.map((entity) => (
                        <div key={entity.key} className="border-l-4 pl-4" style={{ borderColor: "#d1d5db" }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-sm" style={{ color: "#374151" }}>
                              {entity.name}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setAllEntityPermissions(config.module, entity.key, true)}
                                className="text-xs px-2 py-1 rounded hover:bg-green-50"
                                style={{ color: "#52c41a" }}
                              >
                                All
                              </button>
                              <button
                                onClick={() => setAllEntityPermissions(config.module, entity.key, false)}
                                className="text-xs px-2 py-1 rounded hover:bg-red-50"
                                style={{ color: "#dc2626" }}
                              >
                                None
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {entity.actions.map((action) => (
                              <label 
                                key={action} 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer border"
                                style={{ borderColor: getPermissionValue(config.module, entity.key, action) ? "#00A86B" : "#e5e7eb" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={getPermissionValue(config.module, entity.key, action)}
                                  onChange={() => togglePermission(config.module, entity.key, action)}
                                  className="w-4 h-4 rounded"
                                  style={{ accentColor: "#00A86B" }}
                                />
                                <span className="text-xs font-medium capitalize" style={{ color: "#374151" }}>
                                  {action.replace('_', ' ')}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
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

      {/* Assign Role Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6 border-b" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
                  Assign Role to {selectedUser.full_name}
                </h2>
                <button onClick={() => setShowAssignModal(false)} className="ampvibe-button p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                Select a custom role to assign. This will override their default permissions.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    assignRoleMutation.mutate({ userId: selectedUser.id, roleId: null });
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    !selectedUser.custom_role_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium" style={{ color: "#374151" }}>Default ({selectedUser.role})</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>Use system role permissions</p>
                </button>

                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      assignRoleMutation.mutate({ userId: selectedUser.id, roleId: role.id });
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedUser.custom_role_id === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium" style={{ color: "#374151" }}>{role.role_name}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end" style={{ borderColor: "#e5e7eb" }}>
              <NeuroButton onClick={() => setShowAssignModal(false)}>
                Close
              </NeuroButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}