import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Clock } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function SLAPolicies() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    policy_name: "",
    priority: "Medium",
    first_response_time_hours: 24,
    resolution_time_hours: 48,
    business_hours_only: false,
    is_active: true
  });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['sla_policies'],
    queryFn: () => base44.entities.SLA_Policy.list('-created_date')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingPolicy) {
        return base44.entities.SLA_Policy.update(editingPolicy.id, data);
      } else {
        return base44.entities.SLA_Policy.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sla_policies']);
      setShowForm(false);
      setEditingPolicy(null);
      setFormData({
        policy_name: "",
        priority: "Medium",
        first_response_time_hours: 24,
        resolution_time_hours: 48,
        business_hours_only: false,
        is_active: true
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SLA_Policy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sla_policies']);
    }
  });

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      policy_name: policy.policy_name,
      priority: policy.priority,
      first_response_time_hours: policy.first_response_time_hours,
      resolution_time_hours: policy.resolution_time_hours,
      business_hours_only: policy.business_hours_only || false,
      is_active: policy.is_active !== false
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              SLA Policies
            </h1>
            <p style={{ color: "#888" }}>Define service level agreements for ticket response times</p>
          </div>
          <NeuroButton variant="primary" onClick={() => { setShowForm(true); setEditingPolicy(null); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Policy
          </NeuroButton>
        </div>

        {showForm && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              {editingPolicy ? 'Edit Policy' : 'New Policy'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <NeuroInput
                  label="Policy Name"
                  value={formData.policy_name}
                  onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                  required
                  placeholder="e.g., High Priority SLA"
                />
                <NeuroSelect
                  label="Priority Level"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' },
                    { value: 'Urgent', label: 'Urgent' }
                  ]}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <NeuroInput
                  label="First Response Time (hours)"
                  type="number"
                  value={formData.first_response_time_hours}
                  onChange={(e) => setFormData({ ...formData, first_response_time_hours: parseInt(e.target.value) })}
                  required
                />
                <NeuroInput
                  label="Resolution Time (hours)"
                  type="number"
                  value={formData.resolution_time_hours}
                  onChange={(e) => setFormData({ ...formData, resolution_time_hours: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="ampvibe-inset p-4 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.business_hours_only}
                    onChange={(e) => setFormData({ ...formData, business_hours_only: e.target.checked })}
                    className="ampvibe-button w-5 h-5"
                  />
                  <span style={{ color: "#666" }}>Count business hours only (9 AM - 5 PM, Mon-Fri)</span>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <NeuroButton type="button" onClick={() => { setShowForm(false); setEditingPolicy(null); }}>
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Saving...' : 'Save Policy'}
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        )}

        {/* Policies */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No SLA policies found</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Policy
              </NeuroButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies.map((policy) => (
                <div key={policy.id} className="ampvibe-inset p-5 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                        {policy.policy_name}
                      </h3>
                      <span className={`ampvibe-button px-2 py-1 text-xs mb-3 inline-block ${
                        policy.priority === 'Urgent' ? 'text-red-600' :
                        policy.priority === 'High' ? 'text-orange-600' : ''
                      }`}>
                        {policy.priority} Priority
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <NeuroButton size="sm" onClick={() => handleEdit(policy)}>
                        <Edit2 className="w-3 h-3" />
                      </NeuroButton>
                      <NeuroButton 
                        size="sm" 
                        onClick={() => {
                          if (window.confirm('Delete this policy?')) {
                            deleteMutation.mutate(policy.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </NeuroButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="ampvibe-inset p-3 rounded-lg text-center">
                      <p style={{ color: "#888" }}>First Response</p>
                      <p className="text-xl font-bold" style={{ color: "#4a90e2" }}>
                        {policy.first_response_time_hours}h
                      </p>
                    </div>
                    <div className="ampvibe-inset p-3 rounded-lg text-center">
                      <p style={{ color: "#888" }}>Resolution</p>
                      <p className="text-xl font-bold" style={{ color: "#00A86B" }}>
                        {policy.resolution_time_hours}h
                      </p>
                    </div>
                  </div>
                  {policy.business_hours_only && (
                    <p className="text-xs mt-3" style={{ color: "#888" }}>
                      ⏰ Business hours only
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}