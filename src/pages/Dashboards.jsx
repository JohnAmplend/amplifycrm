import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, LayoutDashboard, Star, Edit2, Trash2, Eye } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function Dashboards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    dashboard_name: "",
    dashboard_description: "",
    is_default: false,
    is_shared: false
  });

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ['dashboards'],
    queryFn: () => base44.entities.Dashboards.list('-created_date')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingDashboard) {
        return base44.entities.Dashboards.update(editingDashboard.id, data);
      } else {
        return base44.entities.Dashboards.create({
          ...data,
          created_by: currentUser?.email,
          layout: {}
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboards']);
      setShowForm(false);
      setEditingDashboard(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Dashboards.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboards']);
    }
  });

  const resetForm = () => {
    setFormData({
      dashboard_name: "",
      dashboard_description: "",
      is_default: false,
      is_shared: false
    });
  };

  const handleEdit = (dashboard) => {
    setEditingDashboard(dashboard);
    setFormData({
      dashboard_name: dashboard.dashboard_name,
      dashboard_description: dashboard.dashboard_description || "",
      is_default: dashboard.is_default || false,
      is_shared: dashboard.is_shared || false
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const myDashboards = dashboards.filter(d => d.created_by === currentUser?.email);
  const sharedDashboards = dashboards.filter(d => d.is_shared && d.created_by !== currentUser?.email);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Dashboards
            </h1>
            <p style={{ color: "#888" }}>Create custom analytics dashboards</p>
          </div>
          <NeuroButton 
            variant="primary" 
            onClick={() => { 
              setShowForm(true); 
              setEditingDashboard(null);
              resetForm();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Dashboard
          </NeuroButton>
        </div>

        {showForm && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              {editingDashboard ? 'Edit Dashboard' : 'New Dashboard'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <NeuroInput
                label="Dashboard Name"
                value={formData.dashboard_name}
                onChange={(e) => setFormData({ ...formData, dashboard_name: e.target.value })}
                placeholder="e.g., Sales Overview"
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#333" }}>
                  Description
                </label>
                <textarea
                  value={formData.dashboard_description}
                  onChange={(e) => setFormData({ ...formData, dashboard_description: e.target.value })}
                  className="ampvibe-input w-full min-h-[100px]"
                  placeholder="Describe what this dashboard shows..."
                />
              </div>
              <div className="ampvibe-inset p-4 rounded-lg space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="ampvibe-button w-5 h-5"
                  />
                  <div>
                    <span className="font-medium" style={{ color: "#666" }}>Default Dashboard</span>
                    <p className="text-xs" style={{ color: "#888" }}>
                      Show this dashboard by default
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                    className="ampvibe-button w-5 h-5"
                  />
                  <div>
                    <span className="font-medium" style={{ color: "#666" }}>Share with Team</span>
                    <p className="text-xs" style={{ color: "#888" }}>
                      Make this dashboard visible to all users
                    </p>
                  </div>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <NeuroButton 
                  type="button" 
                  onClick={() => { 
                    setShowForm(false); 
                    setEditingDashboard(null);
                    resetForm();
                  }}
                >
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Saving...' : editingDashboard ? 'Update' : 'Create'} Dashboard
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        )}

        {/* My Dashboards */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            My Dashboards
          </h2>
          {myDashboards.length === 0 ? (
            <NeuroCard>
              <div className="text-center py-12">
                <LayoutDashboard className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
                <p className="mb-4" style={{ color: "#aaa" }}>No dashboards yet</p>
                <NeuroButton onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Dashboard
                </NeuroButton>
              </div>
            </NeuroCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDashboards.map((dashboard) => (
                <NeuroCard key={dashboard.id} className="hover:shadow-xl transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="ampvibe-inset p-3 rounded-lg">
                          <LayoutDashboard className="w-6 h-6" style={{ color: "#4a90e2" }} />
                        </div>
                        <div>
                          <h3 className="font-bold" style={{ color: "#666" }}>
                            {dashboard.dashboard_name}
                          </h3>
                          {dashboard.is_default && (
                            <span className="text-xs" style={{ color: "#52c41a" }}>
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {dashboard.dashboard_description && (
                      <p className="text-sm" style={{ color: "#888" }}>
                        {dashboard.dashboard_description.substring(0, 80)}
                        {dashboard.dashboard_description.length > 80 && '...'}
                      </p>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {dashboard.is_shared && (
                        <span className="ampvibe-button px-2 py-1 text-xs text-blue-600">
                          Shared
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                      <NeuroButton size="sm" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </NeuroButton>
                      <NeuroButton
                        size="sm"
                        onClick={() => handleEdit(dashboard)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </NeuroButton>
                      <NeuroButton
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Delete ${dashboard.dashboard_name}?`)) {
                            deleteMutation.mutate(dashboard.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </NeuroButton>
                    </div>
                  </div>
                </NeuroCard>
              ))}
            </div>
          )}
        </div>

        {/* Shared Dashboards */}
        {sharedDashboards.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Shared Dashboards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedDashboards.map((dashboard) => (
                <NeuroCard key={dashboard.id} className="hover:shadow-xl transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="ampvibe-inset p-3 rounded-lg">
                          <LayoutDashboard className="w-6 h-6" style={{ color: "#4a90e2" }} />
                        </div>
                        <div>
                          <h3 className="font-bold" style={{ color: "#666" }}>
                            {dashboard.dashboard_name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {dashboard.dashboard_description && (
                      <p className="text-sm" style={{ color: "#888" }}>
                        {dashboard.dashboard_description.substring(0, 80)}
                        {dashboard.dashboard_description.length > 80 && '...'}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                      <NeuroButton size="sm" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </NeuroButton>
                    </div>
                  </div>
                </NeuroCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}