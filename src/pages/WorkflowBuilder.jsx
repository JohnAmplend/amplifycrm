import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, X, Trash2, Save, Settings } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import { toast } from "../components/crm/useToast";

export default function WorkflowBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const workflowId = urlParams.get('id');
  const templateIndex = urlParams.get('template');

  const workflowTemplates = [
    {
      name: "New Lead Follow-Up",
      description: "Automatically follow up with new leads from website",
      trigger_type: "Record Created",
      trigger_object: "Lead",
      trigger_conditions: { event: "create" },
      actions: [
        { action_type: "Send Email", action_order: 1, delay_minutes: 60, action_configuration: { recipient_type: "Record Owner" } },
        { action_type: "Create Task", action_order: 2, delay_minutes: 0, action_configuration: { title: "Follow up with lead", priority: "High", due_days: 1 } }
      ]
    },
    {
      name: "Deal Won Celebration",
      description: "Celebrate closed deals and start onboarding",
      trigger_type: "Field Changed",
      trigger_object: "Deal",
      trigger_conditions: { field: "deal_stage", new_value: "Closed Won" },
      actions: [
        { action_type: "Send Email", action_order: 1, delay_minutes: 0, action_configuration: { recipient_type: "Record Owner" } },
        { action_type: "Create Task", action_order: 2, delay_minutes: 0, action_configuration: { title: "Start onboarding", priority: "High", due_days: 3 } }
      ]
    },
    {
      name: "Ticket SLA Alert",
      description: "Alert team when ticket SLA is at risk",
      trigger_type: "Time-Based",
      trigger_object: "Ticket",
      trigger_conditions: { schedule: "every_hour" },
      actions: [
        { action_type: "Send Notification", action_order: 1, delay_minutes: 0, action_configuration: { title: "SLA Alert", user_id: "Record Owner" } }
      ]
    },
    {
      name: "Lead Nurture Sequence",
      description: "Multi-touch email nurture campaign",
      trigger_type: "Record Created",
      trigger_object: "Contact",
      trigger_conditions: { event: "create", stage: "Lead" },
      actions: [
        { action_type: "Send Email", action_order: 1, delay_minutes: 1440, action_configuration: { recipient_type: "Contact Email" } },
        { action_type: "Send Email", action_order: 2, delay_minutes: 4320, action_configuration: { recipient_type: "Contact Email" } },
        { action_type: "Send Email", action_order: 3, delay_minutes: 10080, action_configuration: { recipient_type: "Contact Email" } }
      ]
    },
    {
      name: "Inactive Customer Re-engagement",
      description: "Re-engage customers who haven't been contacted recently",
      trigger_type: "Time-Based",
      trigger_object: "Contact",
      trigger_conditions: { schedule: "weekly", last_contacted: "30_days_ago" },
      actions: [
        { action_type: "Send Email", action_order: 1, delay_minutes: 0, action_configuration: { recipient_type: "Contact Email" } },
        { action_type: "Create Task", action_order: 2, delay_minutes: 0, action_configuration: { title: "Follow up with inactive customer", priority: "Medium", due_days: 7 } }
      ]
    },
    {
      name: "Form to Deal Creation",
      description: "Auto-create deals from demo request forms",
      trigger_type: "Form Submitted",
      trigger_object: "Contact",
      trigger_conditions: { form_name: "Demo Request" },
      actions: [
        { action_type: "Create Record", action_order: 1, delay_minutes: 0, action_configuration: { entity_type: "Deal", field_map: { deal_name: "Demo Request", deal_stage: "Qualified" } } },
        { action_type: "Send Notification", action_order: 2, delay_minutes: 0, action_configuration: { title: "New Demo Request", user_id: "Record Owner" } }
      ]
    }
  ];

  const [workflowData, setWorkflowData] = useState({
    workflow_name: "",
    workflow_description: "",
    trigger_type: "Record Created",
    trigger_object: "Contact",
    trigger_conditions: {},
    is_active: false
  });

  const [actions, setActions] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [newActionType, setNewActionType] = useState("Send Email");

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => workflowId ? base44.entities.Workflows.filter({ id: workflowId }).then(r => r[0]) : null,
    enabled: !!workflowId
  });

  const { data: workflowActions = [] } = useQuery({
    queryKey: ['workflow_actions', workflowId],
    queryFn: () => workflowId ? base44.entities.Workflow_Actions.filter({ workflow_id: workflowId }, 'action_order') : [],
    enabled: !!workflowId
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['email_templates'],
    queryFn: () => base44.entities.Email_Template.filter({ is_active: true })
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  useEffect(() => {
    if (templateIndex !== null && !workflowId) {
      const template = workflowTemplates[parseInt(templateIndex)];
      if (template) {
        setWorkflowData({
          workflow_name: template.name,
          workflow_description: template.description,
          trigger_type: template.trigger_type,
          trigger_object: template.trigger_object,
          trigger_conditions: template.trigger_conditions,
          is_active: false
        });
        if (template.actions) {
          setActions(template.actions);
        }
      }
    } else if (workflow) {
      setWorkflowData(workflow);
    }
  }, [workflow, templateIndex]);

  useEffect(() => {
    if (workflowActions.length > 0 && !templateIndex) {
      setActions(workflowActions);
    }
  }, [workflowActions, templateIndex]);

  const saveWorkflowMutation = useMutation({
    mutationFn: async (data) => {
      if (workflowId) {
        return base44.entities.Workflows.update(workflowId, data);
      } else {
        const workflow = await base44.entities.Workflows.create(data);
        // If we have template actions, create them too
        if (actions.length > 0 && templateIndex !== null) {
          for (const action of actions) {
            await base44.entities.Workflow_Actions.create({
              ...action,
              workflow_id: workflow.id
            });
          }
        }
        return workflow;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['workflows']);
      if (!workflowId) {
        navigate(createPageUrl("WorkflowBuilder") + `?id=${result.id}`);
      }
      toast.success('Workflow saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save workflow: ' + error.message);
    }
  });

  const saveActionMutation = useMutation({
    mutationFn: (action) => {
      if (action.id) {
        return base44.entities.Workflow_Actions.update(action.id, action);
      } else {
        return base44.entities.Workflow_Actions.create({
          ...action,
          workflow_id: workflowId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow_actions']);
      setShowConfigModal(false);
      setCurrentAction(null);
      toast.success('Action saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save action: ' + error.message);
    }
  });

  const deleteActionMutation = useMutation({
    mutationFn: (id) => base44.entities.Workflow_Actions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow_actions']);
      toast.success('Action deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete action: ' + error.message);
    }
  });

  const handleSaveWorkflow = () => {
    saveWorkflowMutation.mutate(workflowData);
  };

  const handleAddAction = () => {
    const newAction = {
      action_type: newActionType,
      action_order: actions.length + 1,
      action_configuration: getDefaultConfig(newActionType),
      delay_minutes: 0
    };
    setCurrentAction(newAction);
    setShowActionModal(false);
    setShowConfigModal(true);
  };

  const handleEditAction = (action) => {
    setCurrentAction(action);
    setShowConfigModal(true);
  };

  const handleSaveAction = () => {
    if (currentAction) {
      saveActionMutation.mutate(currentAction);
    }
  };

  const handleDeleteAction = (id) => {
    if (window.confirm('Are you sure you want to delete this action?')) {
      deleteActionMutation.mutate(id);
    }
  };

  const getDefaultConfig = (actionType) => {
    const defaults = {
      "Send Email": { template_id: "", recipient_type: "Record Owner", email: "" },
      "Create Task": { title: "", assigned_to: "", priority: "Medium", due_days: 3 },
      "Assign Owner": { method: "Specific User", user_id: "", team_id: "", conditions: {} },
      "Update Field": { entity_type: "Contact", field_name: "", value: "" },
      "Create Record": { entity_type: "Contact", field_map: {} },
      "Add to List": { list_id: "" },
      "Send Notification": { title: "", message: "", user_id: "" },
      "Add Tag": { tag: "" },
      "Remove Tag": { tag: "" }
    };
    return defaults[actionType] || {};
  };

  const renderConfigForm = () => {
    if (!currentAction) return null;

    const config = currentAction.action_configuration || {};
    const updateConfig = (key, value) => {
      setCurrentAction({
        ...currentAction,
        action_configuration: { ...config, [key]: value }
      });
    };

    switch (currentAction.action_type) {
      case "Send Email":
        return (
          <div className="space-y-4">
            <NeuroSelect
              label="Email Template"
              value={config.template_id || ""}
              onChange={(e) => updateConfig('template_id', e.target.value)}
              options={emailTemplates.map(t => ({ value: t.id, label: t.template_name }))}
              required
            />
            <NeuroSelect
              label="Recipient Type"
              value={config.recipient_type || "Record Owner"}
              onChange={(e) => updateConfig('recipient_type', e.target.value)}
              options={[
                { value: 'Record Owner', label: 'Record Owner' },
                { value: 'Static Email', label: 'Static Email' },
                { value: 'Contact Email', label: 'Contact Email Field' }
              ]}
              required
            />
            {config.recipient_type === 'Static Email' && (
              <NeuroInput
                label="Email Address"
                type="email"
                value={config.email || ""}
                onChange={(e) => updateConfig('email', e.target.value)}
                placeholder="user@example.com"
                required
              />
            )}
          </div>
        );

      case "Create Task":
        return (
          <div className="space-y-4">
            <NeuroInput
              label="Task Title"
              value={config.title || ""}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="Follow up with {{first_name}}"
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#666" }}>
                Description
              </label>
              <textarea
                value={config.description || ""}
                onChange={(e) => updateConfig('description', e.target.value)}
                className="ampvibe-input w-full min-h-[80px]"
                placeholder="Task details..."
              />
            </div>
            <NeuroSelect
              label="Assign To"
              value={config.assigned_to || ""}
              onChange={(e) => updateConfig('assigned_to', e.target.value)}
              options={[
                { value: 'Record Owner', label: 'Record Owner' },
                ...users.map(u => ({ value: u.email, label: u.full_name || u.email }))
              ]}
              required
            />
            <NeuroSelect
              label="Priority"
              value={config.priority || "Medium"}
              onChange={(e) => updateConfig('priority', e.target.value)}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' }
              ]}
            />
            <NeuroInput
              label="Due in (Days)"
              type="number"
              min="0"
              value={config.due_days || 3}
              onChange={(e) => updateConfig('due_days', parseInt(e.target.value))}
            />
          </div>
        );

      case "Assign Owner":
        return (
          <div className="space-y-4">
            <NeuroSelect
              label="Assignment Method"
              value={config.method || "Specific User"}
              onChange={(e) => updateConfig('method', e.target.value)}
              options={[
                { value: 'Specific User', label: 'Specific User' },
                { value: 'Round Robin', label: 'Round Robin (Team)' },
                { value: 'From Related Record', label: 'From Related Record' }
              ]}
              required
            />
            {config.method === 'Specific User' && (
              <NeuroSelect
                label="User"
                value={config.user_id || ""}
                onChange={(e) => updateConfig('user_id', e.target.value)}
                options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
                required
              />
            )}
            {config.method === 'Round Robin' && (
              <NeuroInput
                label="Team Name"
                value={config.team_id || ""}
                onChange={(e) => updateConfig('team_id', e.target.value)}
                placeholder="Sales Team"
              />
            )}
            {config.method === 'From Related Record' && (
              <NeuroSelect
                label="Related Record Type"
                value={config.related_type || "Company"}
                onChange={(e) => updateConfig('related_type', e.target.value)}
                options={[
                  { value: 'Company', label: 'Company Owner' },
                  { value: 'Contact', label: 'Contact Owner' }
                ]}
              />
            )}
          </div>
        );

      case "Update Field":
        return (
          <div className="space-y-4">
            <NeuroSelect
              label="Entity Type"
              value={config.entity_type || "Contact"}
              onChange={(e) => updateConfig('entity_type', e.target.value)}
              options={[
                { value: 'Contact', label: 'Contact' },
                { value: 'Company', label: 'Company' },
                { value: 'Deal', label: 'Deal' },
                { value: 'Lead', label: 'Lead' }
              ]}
              required
            />
            <NeuroInput
              label="Field Name"
              value={config.field_name || ""}
              onChange={(e) => updateConfig('field_name', e.target.value)}
              placeholder="lifecycle_stage"
              required
            />
            <NeuroInput
              label="New Value"
              value={config.value || ""}
              onChange={(e) => updateConfig('value', e.target.value)}
              placeholder="Customer"
              required
            />
          </div>
        );

      case "Create Record":
        return (
          <div className="space-y-4">
            <NeuroSelect
              label="Entity Type"
              value={config.entity_type || "Contact"}
              onChange={(e) => updateConfig('entity_type', e.target.value)}
              options={[
                { value: 'Contact', label: 'Contact' },
                { value: 'Deal', label: 'Deal' },
                { value: 'Task', label: 'Task' },
                { value: 'Activity', label: 'Activity' }
              ]}
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#666" }}>
                Field Mapping (JSON)
              </label>
              <textarea
                value={JSON.stringify(config.field_map || {}, null, 2)}
                onChange={(e) => {
                  try {
                    updateConfig('field_map', JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                className="ampvibe-input w-full min-h-[120px] font-mono text-sm"
                placeholder='{\n  "first_name": "{{first_name}}",\n  "email": "{{email}}"\n}'
              />
              <p className="text-xs" style={{ color: "#888" }}>
                Use {`{{field_name}}`} to reference trigger record fields
              </p>
            </div>
          </div>
        );

      case "Send Notification":
        return (
          <div className="space-y-4">
            <NeuroInput
              label="Notification Title"
              value={config.title || ""}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="New lead assigned"
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#666" }}>
                Message
              </label>
              <textarea
                value={config.message || ""}
                onChange={(e) => updateConfig('message', e.target.value)}
                className="ampvibe-input w-full min-h-[80px]"
                placeholder="You have been assigned a new lead: {{first_name}} {{last_name}}"
              />
            </div>
            <NeuroSelect
              label="Notify"
              value={config.user_id || "Record Owner"}
              onChange={(e) => updateConfig('user_id', e.target.value)}
              options={[
                { value: 'Record Owner', label: 'Record Owner' },
                ...users.map(u => ({ value: u.email, label: u.full_name || u.email }))
              ]}
            />
          </div>
        );

      case "Add Tag":
      case "Remove Tag":
        return (
          <div className="space-y-4">
            <NeuroInput
              label="Tag Name"
              value={config.tag || ""}
              onChange={(e) => updateConfig('tag', e.target.value)}
              placeholder="VIP Customer"
              required
            />
          </div>
        );

      case "Add to List":
        return (
          <div className="space-y-4">
            <NeuroInput
              label="Contact List ID"
              value={config.list_id || ""}
              onChange={(e) => updateConfig('list_id', e.target.value)}
              placeholder="List ID"
              required
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p style={{ color: "#888" }}>Configuration form for {currentAction.action_type} coming soon.</p>
          </div>
        );
    }
  };

  if (!workflowId && workflow === undefined) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#666" }}>
              Create New Workflow
            </h2>
            <div className="space-y-6">
              <NeuroInput
                label="Workflow Name"
                value={workflowData.workflow_name}
                onChange={(e) => setWorkflowData({ ...workflowData, workflow_name: e.target.value })}
                placeholder="New Lead Follow-up"
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#666" }}>
                  Description
                </label>
                <textarea
                  value={workflowData.workflow_description}
                  onChange={(e) => setWorkflowData({ ...workflowData, workflow_description: e.target.value })}
                  className="ampvibe-input w-full min-h-[100px]"
                  placeholder="Describe what this workflow does..."
                />
              </div>
              <NeuroSelect
                label="Trigger Type"
                value={workflowData.trigger_type}
                onChange={(e) => setWorkflowData({ ...workflowData, trigger_type: e.target.value })}
                options={[
                  { value: 'Record Created', label: 'Record Created' },
                  { value: 'Record Updated', label: 'Record Updated' },
                  { value: 'Form Submitted', label: 'Form Submitted' },
                  { value: 'Email Opened', label: 'Email Opened' },
                  { value: 'Deal Stage Changed', label: 'Deal Stage Changed' }
                ]}
                required
              />
              <NeuroSelect
                label="Trigger Object"
                value={workflowData.trigger_object}
                onChange={(e) => setWorkflowData({ ...workflowData, trigger_object: e.target.value })}
                options={[
                  { value: 'Contact', label: 'Contact' },
                  { value: 'Company', label: 'Company' },
                  { value: 'Deal', label: 'Deal' },
                  { value: 'Lead', label: 'Lead' },
                  { value: 'Ticket', label: 'Ticket' }
                ]}
                required
              />
              <div className="flex justify-end gap-3">
                <NeuroButton onClick={() => navigate(createPageUrl("Workflows"))}>
                  Cancel
                </NeuroButton>
                <NeuroButton 
                  variant="primary" 
                  onClick={handleSaveWorkflow}
                  disabled={saveWorkflowMutation.isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveWorkflowMutation.isLoading ? 'Creating...' : 'Create & Continue'}
                </NeuroButton>
              </div>
            </div>
          </NeuroCard>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("Workflows"))}
            className="ampvibe-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: "#555" }}>
              {workflowData.workflow_name || "Workflow Builder"}
            </h1>
            <p className="text-sm" style={{ color: "#888" }}>
              {workflowData.workflow_description}
            </p>
          </div>
          <div className="flex gap-2">
            <NeuroButton 
              onClick={handleSaveWorkflow}
              disabled={saveWorkflowMutation.isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveWorkflowMutation.isLoading ? 'Saving...' : 'Save'}
            </NeuroButton>
            <button
              onClick={() => setWorkflowData({ ...workflowData, is_active: !workflowData.is_active })}
              className={`ampvibe-button px-4 py-2 ${workflowData.is_active ? 'text-green-600' : 'text-gray-600'}`}
            >
              {workflowData.is_active ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        {/* Trigger Section */}
        <NeuroCard className="mb-6">
          <h3 className="font-bold mb-4" style={{ color: "#666" }}>
            Workflow Trigger
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              label="Trigger Type"
              value={workflowData.trigger_type}
              onChange={(e) => setWorkflowData({ ...workflowData, trigger_type: e.target.value })}
              options={[
                { value: 'Record Created', label: 'Record Created' },
                { value: 'Record Updated', label: 'Record Updated' },
                { value: 'Form Submitted', label: 'Form Submitted' },
                { value: 'Email Opened', label: 'Email Opened' },
                { value: 'Deal Stage Changed', label: 'Deal Stage Changed' }
              ]}
            />
            <NeuroSelect
              label="Trigger Object"
              value={workflowData.trigger_object}
              onChange={(e) => setWorkflowData({ ...workflowData, trigger_object: e.target.value })}
              options={[
                { value: 'Contact', label: 'Contact' },
                { value: 'Company', label: 'Company' },
                { value: 'Deal', label: 'Deal' },
                { value: 'Lead', label: 'Lead' },
                { value: 'Ticket', label: 'Ticket' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Actions Section */}
        <NeuroCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: "#666" }}>
              Workflow Actions ({actions.length})
            </h3>
            <NeuroButton variant="primary" onClick={() => setShowActionModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Action
            </NeuroButton>
          </div>

          {actions.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>
                No actions added yet. Click "Add Action" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((action, index) => (
                <div key={action.id} className="ampvibe-inset p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="ampvibe-button px-3 py-1 text-xs font-bold">
                          Step {index + 1}
                        </span>
                        <span className="ampvibe-button px-3 py-1 text-xs">
                          {action.action_type}
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: "#888" }}>
                        {action.delay_minutes > 0 && (
                          <p className="mb-1">⏱ Delay: {action.delay_minutes} minutes</p>
                        )}
                        {action.action_configuration && Object.keys(action.action_configuration).length > 0 && (
                          <p className="font-mono text-xs">
                            {JSON.stringify(action.action_configuration, null, 2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAction(action)}
                        className="ampvibe-button p-2"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        className="ampvibe-button p-2 text-red-600"
                        disabled={deleteActionMutation.isLoading}
                      >
                        {deleteActionMutation.isLoading ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeuroCard>

        {/* Add Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="ampvibe-card max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                  Add Action
                </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="ampvibe-button p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <NeuroSelect
                  label="Action Type"
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value)}
                  options={[
                    { value: 'Send Email', label: 'Send Email' },
                    { value: 'Create Task', label: 'Create Task' },
                    { value: 'Assign Owner', label: 'Assign Owner' },
                    { value: 'Update Field', label: 'Update Field' },
                    { value: 'Create Record', label: 'Create Record' },
                    { value: 'Add to List', label: 'Add to List' },
                    { value: 'Send Notification', label: 'Send Notification' },
                    { value: 'Add Tag', label: 'Add Tag' },
                    { value: 'Remove Tag', label: 'Remove Tag' }
                  ]}
                />
                <div className="flex justify-end gap-3">
                  <NeuroButton onClick={() => setShowActionModal(false)}>
                    Cancel
                  </NeuroButton>
                  <NeuroButton variant="primary" onClick={handleAddAction}>
                    Continue
                  </NeuroButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configure Action Modal */}
        {showConfigModal && currentAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="ampvibe-card max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                  Configure: {currentAction.action_type}
                </h3>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setCurrentAction(null);
                  }}
                  className="ampvibe-button p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {renderConfigForm()}

                <NeuroInput
                  label="Delay Before Executing (Minutes)"
                  type="number"
                  min="0"
                  value={currentAction.delay_minutes || 0}
                  onChange={(e) => setCurrentAction({ ...currentAction, delay_minutes: parseInt(e.target.value) || 0 })}
                />

                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                  <NeuroButton onClick={() => {
                    setShowConfigModal(false);
                    setCurrentAction(null);
                  }}>
                    Cancel
                  </NeuroButton>
                  <NeuroButton 
                    variant="primary" 
                    onClick={handleSaveAction}
                    disabled={saveActionMutation.isLoading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveActionMutation.isLoading ? 'Saving...' : 'Save Action'}
                  </NeuroButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}