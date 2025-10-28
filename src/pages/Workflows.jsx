
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Zap, Play, Pause, Edit2, Trash2, Clock, Copy, TrendingUp, ChevronDown } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Workflows() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("");
  const [filterObject, setFilterObject] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => base44.entities.Workflows.list('-created_date')
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['workflow_executions'],
    queryFn: () => base44.entities.Workflow_Executions.list('-started_at', 100)
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

  const cloneMutation = useMutation({
    mutationFn: async (workflow) => {
      return base44.entities.Workflows.create({
        workflow_name: `${workflow.workflow_name} (Copy)`,
        workflow_description: workflow.workflow_description,
        trigger_type: workflow.trigger_type,
        trigger_object: workflow.trigger_object,
        trigger_conditions: workflow.trigger_conditions,
        is_active: false,
        created_by: currentUser?.email,
        execution_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
    }
  });

  const workflowTemplates = [
    {
      name: "New Lead Follow-Up",
      description: "Automatically follow up with new leads from website",
      trigger: "Record Created",
      object: "Lead"
    },
    {
      name: "Deal Won Celebration",
      description: "Celebrate closed deals and start onboarding",
      trigger: "Deal Stage Changed",
      object: "Deal"
    },
    {
      name: "Ticket SLA Alert",
      description: "Alert team when ticket SLA is at risk",
      trigger: "Time-Based",
      object: "Ticket"
    },
    {
      name: "Lead Nurture Sequence",
      description: "Multi-touch email nurture campaign",
      trigger: "Record Created",
      object: "Contact"
    },
    {
      name: "Inactive Customer Re-engagement",
      description: "Re-engage customers who haven't been contacted recently",
      trigger: "Time-Based",
      object: "Contact"
    },
    {
      name: "Form to Deal Creation",
      description: "Auto-create deals from demo request forms",
      trigger: "Form Submitted",
      object: "Contact"
    }
  ];

  const filteredWorkflows = workflows.filter(w => {
    const statusMatch = !filterStatus || 
      (filterStatus === 'active' && w.is_active) ||
      (filterStatus === 'inactive' && !w.is_active);
    const objectMatch = !filterObject || w.trigger_object === filterObject;
    return statusMatch && objectMatch;
  });

  const activeWorkflows = workflows.filter(w => w.is_active).length;
  const totalExecutions = workflows.reduce((sum, w) => sum + (w.execution_count || 0), 0);
  const recentExecutions = executions.filter(e => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(e.started_at) > dayAgo;
  }).length;

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
            onClick={() => navigate(createPageUrl("WorkflowBuilder"))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </NeuroButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <NeuroCard className="text-center">
            <Zap className="w-8 h-8 mx-auto mb-2" style={{ color: "#52c41a" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {activeWorkflows}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Active Workflows</p>
          </NeuroCard>
          <NeuroCard className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: "#4a90e2" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {totalExecutions.toLocaleString()}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Total Executions</p>
          </NeuroCard>
          <NeuroCard className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "#fa8c16" }} />
            <p className="text-2xl font-bold" style={{ color: "#666" }}>
              {recentExecutions}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>Last 24 Hours</p>
          </NeuroCard>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              placeholder="All Statuses"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive Only' }
              ]}
            />
            <NeuroSelect
              placeholder="All Objects"
              value={filterObject}
              onChange={(e) => setFilterObject(e.target.value)}
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

        {/* Workflow Templates */}
        {workflows.length === 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Workflow Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTemplates.map((template, idx) => (
                <NeuroCard key={idx} className="hover:shadow-xl transition-shadow">
                  <div className="space-y-3">
                    <div className="ampvibe-inset p-2 rounded-lg">
                      <Zap className="w-5 h-5" style={{ color: "#4a90e2" }} />
                    </div>
                    <h3 className="font-bold" style={{ color: "#666" }}>
                      {template.name}
                    </h3>
                    <p className="text-sm" style={{ color: "#888" }}>
                      {template.description}
                    </p>
                    <div className="flex gap-2">
                      <span className="ampvibe-button px-2 py-1 text-xs">
                        {template.trigger}
                      </span>
                      <span className="ampvibe-button px-2 py-1 text-xs">
                        {template.object}
                      </span>
                    </div>
                    <NeuroButton size="sm" className="w-full">
                      Use Template
                    </NeuroButton>
                  </div>
                </NeuroCard>
              ))}
            </div>
          </div>
        )}

        {/* Workflows List */}
        {filteredWorkflows.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Your Workflows
            </h2>
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <NeuroCard key={workflow.id} className="hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="ampvibe-inset p-3 rounded-lg">
                      <Zap className="w-6 h-6" style={{ color: workflow.is_active ? "#52c41a" : "#888" }} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg mb-1" style={{ color: "#666" }}>
                            {workflow.workflow_name}
                          </h3>
                          {workflow.workflow_description && (
                            <p className="text-sm mb-2" style={{ color: "#888" }}>
                              {workflow.workflow_description}
                            </p>
                          )}
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

                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`ampvibe-button px-3 py-1 text-xs ${
                          workflow.is_active ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="ampvibe-button px-3 py-1 text-xs">
                          {workflow.trigger_type}
                        </span>
                        <span className="ampvibe-button px-3 py-1 text-xs">
                          {workflow.trigger_object}
                        </span>
                        <span className="text-xs" style={{ color: "#aaa" }}>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {workflow.execution_count || 0} executions
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <NeuroButton
                          size="sm"
                          onClick={() => navigate(createPageUrl("WorkflowBuilder") + `?id=${workflow.id}`)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </NeuroButton>
                        <NeuroButton
                          size="sm"
                          onClick={() => cloneMutation.mutate(workflow)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Clone
                        </NeuroButton>
                        <NeuroButton
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete ${workflow.workflow_name}?`)) {
                              deleteMutation.mutate(workflow.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </NeuroButton>
                      </div>
                    </div>
                  </div>
                </NeuroCard>
              ))}
            </div>
          </>
        )}

        {workflows.length === 0 && (
          <NeuroCard className="mt-6">
            <div className="text-center py-12">
              <Zap className="w-16 h-16 mx-auto mb-4" style={{ color: "#ccc" }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: "#666" }}>
                Automate Your CRM
              </h3>
              <p className="mb-6" style={{ color: "#888" }}>
                Save time by automating repetitive tasks. Start with a template or build from scratch.
              </p>
              <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("WorkflowBuilder"))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workflow
              </NeuroButton>
            </div>
          </NeuroCard>
        )}

        {/* Info Card - Now Collapsible */}
        <NeuroCard className="mt-6">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-bold" style={{ color: "#666" }}>
              What can Workflows do?
            </h3>
            <ChevronDown 
              className={`w-5 h-5 transition-transform ${showHelp ? 'rotate-180' : ''}`}
              style={{ color: "#666" }}
            />
          </button>
          
          {showHelp && (
            <div className="grid md:grid-cols-2 gap-4 text-sm mt-4" style={{ color: "#888" }}>
              <div>
                <p className="font-medium mb-2" style={{ color: "#666" }}>✨ Send Emails</p>
                <p>Automatically send personalized emails based on triggers</p>
              </div>
              <div>
                <p className="font-medium mb-2" style={{ color: "#666" }}>✅ Create Tasks</p>
                <p>Assign tasks to team members with due dates</p>
              </div>
              <div>
                <p className="font-medium mb-2" style={{ color: "#666" }}>📝 Update Fields</p>
                <p>Change property values automatically</p>
              </div>
              <div>
                <p className="font-medium mb-2" style={{ color: "#666" }}>🔔 Send Notifications</p>
                <p>Alert team members of important events</p>
              </div>
              <div>
                <p className="font-medium mb-2" style={{ color: "#666" }}>⏱️ Add Delays</p>
                <p>Wait specific time periods between actions</p>
              </div>
              <div>
                <p className="font-medium mb-2" style={{ color: "#666" }}>🔀 Branching Logic</p>
                <p>Create different paths based on conditions</p>
              </div>
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}
