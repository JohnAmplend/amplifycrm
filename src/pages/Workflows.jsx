import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Zap, Play, Pause, Edit2, Trash2, Clock } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Workflows() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    workflow_name: "",
    workflow_description: "",
    trigger_type: "Record Created",
    trigger_object: "Contact",
    trigger_conditions: {},
    is_active: false
  });

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflows.list('-created_date')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingWorkflow) {
        return base44.entities.Workflows.update(editingWorkflow.id, data);
      } else {
        return base44.entities.Workflows.create({
          ...data,
          created_by: currentUser?.email,
          execution_count: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      setShowForm(false);
      setEditingWorkflow(null);
      resetForm();
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.Workflows.update(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflows.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
    }
  });

  const resetForm = () => {
    setFormData({
      workflow_name: "",
      workflow_description: "",
      trigger_type: "Record Created",
      trigger_object: "Contact",
      trigger_conditions: {},
      is_active: false
    });
  };

  const handleEdit = (workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      workflow_name: workflow.workflow_name,
      workflow_description: workflow.workflow_description || "",
      trigger_type: workflow.trigger_type,
      trigger_object: workflow.trigger_object,
      trigger_conditions: workflow.trigger_conditions || {},
      is_active: workflow.is_active
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
              Workflows
            </h1>
            <p style={{ color: "#888" }}>Automate your business processes</p>
          </div>
          <NeuroButton 
            variant="primary" 
            onClick={() => { 
              setShowForm(true); 
              setEditingWorkflow(null);
              resetForm();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </NeuroButton>
        </div>

        {showForm && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              {editingWorkflow ? 'Edit Workflow' : 'New Workflow'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <NeuroInput
                label="Workflow Name"
                value={formData.workflow_name}
                onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#333" }}>
                  Description
                </label>
                <textarea
                  value={formData.workflow_description}
                  onChange={(e) => setFormData({ ...formData, workflow_description: e.target.value })}
                  className="ampvibe-input w-full min-h-[100px]"
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <NeuroSelect
                  label="Trigger Type"
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                  options={[
                    { value: 'Record Created', label: 'Record Created' },
                    { value: 'Record Updated', label: 'Record Updated' },
                    { value: 'Form Submitted', label: 'Form Submitted' },
                    { value: 'Email Opened', label: 'Email Opened' },
                    { value: 'Deal Stage Changed', label: 'Deal Stage Changed' },
                    { value: 'Time-Based', label: 'Time-Based' },
                    { value: 'Manual', label: 'Manual' }
                  ]}
                  required
                />
                <NeuroSelect
                  label="Trigger Object"
                  value={formData.trigger_object}
                  onChange={(e) => setFormData({ ...formData, trigger_object: e.target.value })}
                  options={[
                    { value: 'Contact', label: 'Contact' },
                    { value: 'Company', label: 'Company' },
                    { value: 'Deal', label: 'Deal' },
                    { value: 'Lead', label: 'Lead' },
                    { value: 'Ticket', label: 'Ticket' }
                  ]}
                  required
                />
              </div>
              <div className="ampvibe-inset p-4 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="ampvibe-button w-5 h-5"
                  />
                  <div>
                    <span className="font-medium" style={{ color: "#666" }}>Activate Workflow</span>
                    <p className="text-xs" style={{ color: "#888" }}>
                      Start running this workflow automatically
                    </p>
                  </div>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <NeuroButton 
                  type="button" 
                  onClick={() => { 
                    setShowForm(false); 
                    setEditingWorkflow(null);
                    resetForm();
                  }}
                >
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Saving...' : editingWorkflow ? 'Update' : 'Create'} Workflow
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        )}

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12" style={{ color: "#aaa" }}>
              Loading workflows...
            </div>
          ) : workflows.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Zap className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No workflows yet</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workflow
              </NeuroButton>
            </div>
          ) : (
            workflows.map((workflow) => (
              <NeuroCard key={workflow.id} className="hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="ampvibe-inset p-3 rounded-lg">
                        <Zap className="w-6 h-6" style={{ color: workflow.is_active ? "#52c41a" : "#888" }} />
                      </div>
                      <div>
                        <h3 className="font-bold" style={{ color: "#666" }}>
                          {workflow.workflow_name}
                        </h3>
                        <p className="text-xs" style={{ color: "#888" }}>
                          {workflow.trigger_type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: workflow.id, isActive: workflow.is_active })}
                      className="ampvibe-button p-2"
                    >
                      {workflow.is_active ? (
                        <Pause className="w-4 h-4" style={{ color: "#52c41a" }} />
                      ) : (
                        <Play className="w-4 h-4" style={{ color: "#888" }} />
                      )}
                    </button>
                  </div>

                  {workflow.workflow_description && (
                    <p className="text-sm" style={{ color: "#888" }}>
                      {workflow.workflow_description.substring(0, 100)}
                      {workflow.workflow_description.length > 100 && '...'}
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <span className={`ampvibe-button px-2 py-1 text-xs ${
                      workflow.is_active ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {workflow.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="ampvibe-button px-2 py-1 text-xs">
                      {workflow.trigger_object}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs" style={{ color: "#aaa" }}>
                    <Clock className="w-3 h-3" />
                    <span>Executed {workflow.execution_count || 0} times</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                    <NeuroButton
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(workflow)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Delete ${workflow.workflow_name}?`)) {
                          deleteMutation.mutate(workflow.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </NeuroButton>
                  </div>
                </div>
              </NeuroCard>
            ))
          )}
        </div>

        {/* Info Card */}
        <NeuroCard className="mt-6">
          <h3 className="font-bold mb-3" style={{ color: "#666" }}>
            What are Workflows?
          </h3>
          <p className="text-sm mb-3" style={{ color: "#888" }}>
            Workflows automate repetitive tasks by triggering actions when specific events occur. 
            For example, automatically send a welcome email when a new contact is created, or assign a task when a deal reaches a certain stage.
          </p>
          <p className="text-sm" style={{ color: "#888" }}>
            Create workflows to save time and ensure consistency in your business processes.
          </p>
        </NeuroCard>
      </div>
    </div>
  );
}