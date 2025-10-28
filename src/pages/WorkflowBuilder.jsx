import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Trash2, Save, Zap } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [workflowId, setWorkflowId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    workflow_name: "",
    workflow_description: "",
    trigger_type: "Record Created",
    trigger_object: "Contact",
    trigger_conditions: {},
    is_active: false
  });
  const [actions, setActions] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setWorkflowId(id);
  }, []);

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => base44.entities.Workflows.filter({ id: workflowId }),
    enabled: !!workflowId,
    select: (data) => data[0]
  });

  const { data: workflowActions = [] } = useQuery({
    queryKey: ['workflow_actions', workflowId],
    queryFn: () => base44.entities.Workflow_Actions.filter({ workflow_id: workflowId }, 'action_order'),
    enabled: !!workflowId
  });

  useEffect(() => {
    if (workflow) {
      setFormData({
        workflow_name: workflow.workflow_name,
        workflow_description: workflow.workflow_description || "",
        trigger_type: workflow.trigger_type,
        trigger_object: workflow.trigger_object,
        trigger_conditions: workflow.trigger_conditions || {},
        is_active: workflow.is_active
      });
    }
    if (workflowActions.length > 0) {
      setActions(workflowActions.map(a => ({
        id: a.id,
        action_type: a.action_type,
        action_configuration: a.action_configuration || {},
        delay_minutes: a.delay_minutes || 0
      })));
    }
  }, [workflow, workflowActions]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let wfId = workflowId;
      
      if (workflowId) {
        await base44.entities.Workflows.update(workflowId, data);
      } else {
        const newWorkflow = await base44.entities.Workflows.create({
          ...data,
          created_by: currentUser?.email,
          execution_count: 0
        });
        wfId = newWorkflow.id;
        setWorkflowId(wfId);
      }

      // Delete existing actions
      if (workflowId) {
        const existingActions = await base44.entities.Workflow_Actions.filter({ workflow_id: workflowId });
        await Promise.all(existingActions.map(a => base44.entities.Workflow_Actions.delete(a.id)));
      }

      // Create new actions
      await Promise.all(actions.map((action, index) => 
        base44.entities.Workflow_Actions.create({
          workflow_id: wfId,
          action_order: index + 1,
          action_type: action.action_type,
          action_configuration: action.action_configuration,
          delay_minutes: action.delay_minutes || 0
        })
      ));

      return wfId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      queryClient.invalidateQueries(['workflow_actions']);
      navigate(createPageUrl("Workflows"));
    }
  });

  const handleAddAction = () => {
    setActions([...actions, {
      action_type: "Send Email",
      action_configuration: {},
      delay_minutes: 0
    }]);
  };

  const handleRemoveAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (index, field, value) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("Workflows"))}>
            <ArrowLeft className="w-4 h-4" />
          </NeuroButton>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
              {workflowId ? 'Edit Workflow' : 'Create Workflow'}
            </h1>
            <p style={{ color: "#888" }}>Build your automation workflow</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <NeuroCard>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              1. Workflow Details
            </h2>
            <div className="space-y-4">
              <NeuroInput
                label="Workflow Name"
                value={formData.workflow_name}
                onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                placeholder="e.g., New Lead Follow-Up Sequence"
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#333" }}>
                  Description
                </label>
                <textarea
                  value={formData.workflow_description}
                  onChange={(e) => setFormData({ ...formData, workflow_description: e.target.value })}
                  className="ampvibe-input w-full min-h-[80px]"
                  placeholder="Describe what this workflow does..."
                />
              </div>
            </div>
          </NeuroCard>

          {/* Trigger */}
          <NeuroCard>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              2. When should this workflow run?
            </h2>
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
                  { value: 'Manual', label: 'Manual' },
                  { value: 'Lead Score Reached', label: 'Lead Score Reached' }
                ]}
                required
              />
              <NeuroSelect
                label="Object Type"
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
          </NeuroCard>

          {/* Actions */}
          <NeuroCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                3. What should happen?
              </h2>
              <NeuroButton type="button" onClick={handleAddAction}>
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </NeuroButton>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-8 ampvibe-inset rounded-lg">
                <p className="mb-4" style={{ color: "#888" }}>
                  No actions yet. Add your first action to get started.
                </p>
                <NeuroButton type="button" onClick={handleAddAction}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Action
                </NeuroButton>
              </div>
            ) : (
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <div key={index} className="ampvibe-inset p-4 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="ampvibe-button px-3 py-2 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <NeuroSelect
                            label="Action Type"
                            value={action.action_type}
                            onChange={(e) => handleActionChange(index, 'action_type', e.target.value)}
                            options={[
                              { value: 'Send Email', label: 'Send Email' },
                              { value: 'Create Task', label: 'Create Task' },
                              { value: 'Update Field', label: 'Update Field' },
                              { value: 'Add to List', label: 'Add to List' },
                              { value: 'Remove from List', label: 'Remove from List' },
                              { value: 'Create Record', label: 'Create Record' },
                              { value: 'Assign Owner', label: 'Assign Owner' },
                              { value: 'Add Tag', label: 'Add Tag' },
                              { value: 'Remove Tag', label: 'Remove Tag' },
                              { value: 'Send Notification', label: 'Send Notification' },
                              { value: 'Wait', label: 'Wait / Delay' }
                            ]}
                          />
                          <NeuroInput
                            label="Delay Before Action (minutes)"
                            type="number"
                            value={action.delay_minutes}
                            onChange={(e) => handleActionChange(index, 'delay_minutes', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="ampvibe-inset p-3 rounded-lg">
                          <p className="text-xs mb-2" style={{ color: "#888" }}>
                            Action Configuration
                          </p>
                          <p className="text-sm" style={{ color: "#666" }}>
                            {action.action_type} - Configure in advanced settings
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAction(index)}
                        className="ampvibe-button p-2"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: "#f5222d" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NeuroCard>

          {/* Activation */}
          <NeuroCard>
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
                    Start running this workflow automatically when triggers occur
                  </p>
                </div>
              </label>
            </div>
          </NeuroCard>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <NeuroButton 
              type="button" 
              onClick={() => navigate(createPageUrl("Workflows"))}
            >
              Cancel
            </NeuroButton>
            <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isLoading ? 'Saving...' : 'Save Workflow'}
            </NeuroButton>
          </div>
        </form>

        {/* Help Card */}
        <NeuroCard className="mt-6">
          <h3 className="font-bold mb-3" style={{ color: "#666" }}>
            💡 Workflow Tips
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: "#888" }}>
            <li>• Start with simple workflows and add complexity gradually</li>
            <li>• Use delays between actions to avoid overwhelming contacts</li>
            <li>• Test workflows with sample data before activating</li>
            <li>• Monitor execution logs to identify issues</li>
            <li>• Use clear, descriptive names for easy management</li>
          </ul>
        </NeuroCard>
      </div>
    </div>
  );
}