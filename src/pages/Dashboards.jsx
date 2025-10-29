
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, LayoutDashboard, Star, Edit2, Trash2, Eye, X, Search } from "lucide-react"; // Added X and Search
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";

export default function Dashboards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(""); // New state for search
  const [showForm, setShowForm] = useState(false);
  // editingDashboard state is removed as the new form is purely for creation when showForm is true
  const [currentUser, setCurrentUser] = useState(null); // Kept currentUser for created_by in mutation
  const [formData, setFormData] = useState({
    dashboard_name: "",
    dashboard_description: "",
    layout: {}, // Added layout to formData
    is_default: false,
    is_shared: false
  });

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => { });
  }, []);

  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ['dashboards'],
    queryFn: () => base44.entities.Dashboards.list('-created_date')
  });

  // The outline implies the form is purely for creating, not editing.
  // So the saveMutation will only handle 'create' logic.
  const saveMutation = useMutation({
    mutationFn: (data) => {
      // The outline's new form structure suggests a "New Dashboard" only.
      // The update logic for editingDashboard is removed.
      return base44.entities.Dashboards.create({
        ...data,
        created_by: currentUser?.email,
        layout: data.layout || {} // Ensure layout is always an object, use formData.layout
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboards']);
      setShowForm(false);
      // setEditingDashboard(null); // Removed as editingDashboard state is removed
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
      layout: {}, // Reset layout as well
      is_default: false,
      is_shared: false
    });
  };

  // handleEdit function is removed as the new form does not support editing directly from the main view.
  // The outline implies a simplified flow where `showForm` is only for "Create".

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  // Filtering dashboards based on search term
  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.dashboard_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dashboard.dashboard_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Conditional rendering for the "New Dashboard" form when showForm is true
  if (showForm) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                New Dashboard
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="ampvibe-button p-2"
              >
                <X className="w-5 h-5" style={{ color: "#888" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <NeuroInput
                label="Dashboard Name"
                value={formData.dashboard_name}
                onChange={(e) => setFormData({ ...formData, dashboard_name: e.target.value })}
                placeholder="e.g., Sales Overview Dashboard"
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#666" }}>
                  Description
                </label>
                <textarea
                  value={formData.dashboard_description}
                  onChange={(e) => setFormData({ ...formData, dashboard_description: e.target.value })}
                  className="ampvibe-input w-full min-h-[80px]"
                  placeholder="Brief description of this dashboard"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="ampvibe-button"
                />
                <label className="text-sm" style={{ color: "#666" }}>Set as default dashboard</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_shared}
                  onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  className="ampvibe-button"
                />
                <label className="text-sm" style={{ color: "#666" }}>Share with all users</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <NeuroButton type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Creating...' : 'Create Dashboard'}
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        </div>
      </div>
    );
  }

  // Main dashboard list view
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Dashboards
            </h1>
            <p style={{ color: "#888" }}>{filteredDashboards.length} total dashboards</p> {/* Updated count */}
          </div>
          <NeuroButton
            variant="primary"
            onClick={() => {
              setShowForm(true);
              // setEditingDashboard(null); // No longer needed
              resetForm();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Dashboard
          </NeuroButton>
        </div>

        {/* Search Input */}
        <NeuroCard className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
            <input
              type="text"
              placeholder="Search dashboards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neuro-input w-full pl-12"
            />
          </div>
        </NeuroCard>

        <div className="grid gap-4"> {/* Changed to a single grid for all dashboards */}
          {isLoading ? (
            <NeuroCard>
              <div className="text-center py-12" style={{ color: "#aaa" }}>
                Loading dashboards...
              </div>
            </NeuroCard>
          ) : filteredDashboards.length === 0 ? (
            <NeuroCard>
              <div className="text-center py-12">
                <p className="mb-4" style={{ color: "#aaa" }}>No dashboards found</p>
                <NeuroButton onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Dashboard
                </NeuroButton>
              </div>
            </NeuroCard>
          ) : (
            filteredDashboards.map((dashboard) => ( // Render filtered dashboards
              <NeuroCard key={dashboard.id} className="hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                        {dashboard.dashboard_name}
                      </h3>
                      {dashboard.is_default && (
                        <span className="ampvibe-button px-2 py-1 text-xs text-green-600">
                          Default
                        </span>
                      )}
                      {dashboard.is_shared && (
                        <span className="ampvibe-button px-2 py-1 text-xs text-blue-600">
                          Shared
                        </span>
                      )}
                    </div>
                    {dashboard.dashboard_description && (
                      <p className="mb-3" style={{ color: "#888" }}>
                        {dashboard.dashboard_description}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: "#aaa" }}>
                      Created {new Date(dashboard.created_date).toLocaleDateString()} by {dashboard.created_by || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <NeuroButton size="sm" onClick={() => navigate(createPageUrl("DashboardViewer") + `?id=${dashboard.id}`)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </NeuroButton>
                    {/* The outline removes the inline Edit button, implying a simpler list view. */}
                    {/* Only allow deletion for dashboards created by the current user */}
                    {dashboard.created_by === currentUser?.email && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete dashboard "${dashboard.dashboard_name}"?`)) {
                            deleteMutation.mutate(dashboard.id);
                          }
                        }}
                        className="ampvibe-button p-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </NeuroCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
