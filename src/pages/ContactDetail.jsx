import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Edit2, Trash2, Plus, Building2, DollarSign, Settings, LayoutTemplate } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import ContactForm from "../components/crm/ContactForm";
import ActivityTimeline from "../components/crm/ActivityTimeline.jsx";
import TaskList from "../components/crm/TaskList.jsx";
import ViewLayoutEditor from "../components/crm/ViewLayoutEditor.jsx";

export default function ContactDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contactId, setContactId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    setContactId(urlParams.get('id'));
  }, []);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => base44.entities.Contact.filter({ id: contactId }),
    enabled: !!contactId,
    select: (data) => data[0]
  });

  const { data: company } = useQuery({
    queryKey: ['company', contact?.company_id],
    queryFn: () => base44.entities.Company.filter({ id: contact.company_id }),
    enabled: !!contact?.company_id,
    select: (data) => data[0]
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', contactId],
    queryFn: () => base44.entities.Deal.filter({ contact_id: contactId }),
    enabled: !!contactId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', contactId],
    queryFn: () => base44.entities.Activity.filter({ contact_id: contactId }, '-created_date'),
    enabled: !!contactId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', contactId],
    queryFn: () => base44.entities.Task.filter({ related_to_type: 'Contact', related_to_id: contactId }),
    enabled: !!contactId
  });

  // Fetch ALL view templates
  const { data: viewTemplates = [] } = useQuery({
    queryKey: ['contact_view_templates'],
    queryFn: () => base44.entities.Contact_Detail_View.list()
  });

  // Get default view
  const defaultView = viewTemplates.find(v => v.is_default) || null;

  // Get currently selected view (default if not specified)
  const activeView = selectedTemplateId 
    ? viewTemplates.find(v => v.id === selectedTemplateId) 
    : defaultView;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.update(contactId, data),
    onMutate: async (updatedData) => {
      await queryClient.cancelQueries(['contact', contactId]);
      await queryClient.cancelQueries(['contacts']);

      const previousContact = queryClient.getQueryData(['contact', contactId]);
      const previousContacts = queryClient.getQueryData(['contacts']);

      queryClient.setQueryData(['contact', contactId], (old) => {
        return old ? [{ ...old[0], ...updatedData }] : old;
      });

      queryClient.setQueryData(['contacts'], (old) => {
        if (!old) return old;
        return old.map(c => c.id === contactId ? { ...c, ...updatedData } : c);
      });

      return { previousContact, previousContacts };
    },
    onError: (err, updatedData, context) => {
      if (context?.previousContact) {
        queryClient.setQueryData(['contact', contactId], context.previousContact);
      }
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
      alert('Failed to update contact: ' + err.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contact', contactId]);
      queryClient.invalidateQueries(['contacts']);
      setEditMode(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Contact.delete(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      navigate(createPageUrl("Contacts"));
    }
  });

  const saveViewMutation = useMutation({
    mutationFn: async (viewConfig) => {
      if (editingTemplate?.id) {
        return await base44.entities.Contact_Detail_View.update(editingTemplate.id, viewConfig);
      } else {
        return await base44.entities.Contact_Detail_View.create(viewConfig);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contact_view_templates']);
      setLayoutEditMode(false);
      setEditingTemplate(null);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId) => base44.entities.Contact_Detail_View.delete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact_view_templates']);
      setShowTemplateSelector(false);
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (templateId) => {
      // First, unset all other defaults
      const updates = viewTemplates
        .filter(v => v.is_default && v.id !== templateId)
        .map(v => base44.entities.Contact_Detail_View.update(v.id, { is_default: false }));
      
      await Promise.all(updates);
      
      // Then set the new default
      return await base44.entities.Contact_Detail_View.update(templateId, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contact_view_templates']);
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate();
    }
  };

  const handleCreateDefaultTemplate = async () => {
    const defaultTemplate = {
      view_name: "Default View",
      is_default: true,
      sections: [
        {
          id: "section-1",
          title: "Contact Information",
          fields: [
            { name: "first_name", label: "First Name", type: "text", required: true },
            { name: "last_name", label: "Last Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email" },
            { name: "phone", label: "Phone", type: "text" },
            { name: "mobile", label: "Mobile", type: "text" },
            { name: "job_title", label: "Job Title", type: "text" },
            { name: "department", label: "Department", type: "text" }
          ]
        },
        {
          id: "section-2",
          title: "Status & Lifecycle",
          fields: [
            { name: "lifecycle_stage", label: "Lifecycle Stage", type: "select" },
            { name: "lead_status", label: "Lead Status", type: "select" }
          ]
        },
        {
          id: "section-3",
          title: "Address",
          fields: [
            { name: "address", label: "Address", type: "text" },
            { name: "city", label: "City", type: "text" },
            { name: "state", label: "State", type: "text" },
            { name: "zip", label: "Zip", type: "text" },
            { name: "country", label: "Country", type: "text" }
          ]
        }
      ],
      custom_fields: [],
      layout_configuration: {}
    };
    
    await base44.entities.Contact_Detail_View.create(defaultTemplate);
    queryClient.invalidateQueries(['contact_view_templates']);
  };

  const renderFieldByType = (field, value, onChange, isEditing) => {
    const fieldValue = field.name.startsWith('custom_') 
      ? contact?.custom_data?.[field.name] 
      : contact?.[field.name];

    if (!isEditing) {
      if (field.type === 'select' && field.name === 'lifecycle_stage') {
        return <span className="neuro-button px-2 py-1 text-sm">{fieldValue || '—'}</span>;
      }
      if (field.type === 'select' && field.name === 'lead_status') {
        return <span className="neuro-button px-2 py-1 text-sm">{fieldValue || '—'}</span>;
      }
      if (field.type === 'checkbox') {
        return <span className="neuro-button px-2 py-1 text-sm">{fieldValue ? 'Yes' : 'No'}</span>;
      }
      return <p style={{ color: "#666" }}>{fieldValue || '—'}</p>;
    }

    if (field.type === 'select') {
      const options = field.name === 'lifecycle_stage' 
        ? ['Subscriber', 'Lead', 'MQL', 'SQL', 'Opportunity', 'Customer']
        : field.name === 'lead_status'
        ? ['New', 'Attempting', 'Connected', 'Qualified', 'Unqualified']
        : [];

      return (
        <select
          value={fieldValue || ''}
          onChange={onChange}
          className="ampvibe-input w-full"
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={fieldValue || ''}
          onChange={onChange}
          className="ampvibe-input w-full min-h-[80px]"
        />
      );
    }

    if (field.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={!!fieldValue}
          onChange={onChange}
          className="ampvibe-button"
        />
      );
    }

    return (
      <input
        type={field.type || 'text'}
        value={fieldValue || ''}
        onChange={onChange}
        className="ampvibe-input w-full"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Contact not found
        </div>
      </div>
    );
  }

  // Template selector modal
  if (showTemplateSelector && currentUser?.role === 'admin') {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                Manage View Templates
              </h2>
              <div className="flex gap-2">
                <NeuroButton variant="primary" onClick={() => {
                  setEditingTemplate(null);
                  setLayoutEditMode(true);
                  setShowTemplateSelector(false);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Template
                </NeuroButton>
                <NeuroButton onClick={() => setShowTemplateSelector(false)}>
                  Close
                </NeuroButton>
              </div>
            </div>

            {viewTemplates.length === 0 ? (
              <div className="text-center py-12">
                <p className="mb-4" style={{ color: "#888" }}>No templates yet</p>
                <NeuroButton variant="primary" onClick={handleCreateDefaultTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Default Template
                </NeuroButton>
              </div>
            ) : (
              <div className="space-y-3">
                {viewTemplates.map((template) => (
                  <div key={template.id} className="ampvibe-inset p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold" style={{ color: "#666" }}>
                          {template.view_name}
                        </p>
                        <p className="text-sm" style={{ color: "#888" }}>
                          {template.sections?.length || 0} sections • {template.custom_fields?.length || 0} custom fields
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.is_default && (
                          <span className="neuro-button px-3 py-1 text-xs text-green-600">
                            Default
                          </span>
                        )}
                        {!template.is_default && (
                          <NeuroButton size="sm" onClick={() => setDefaultMutation.mutate(template.id)}>
                            Set as Default
                          </NeuroButton>
                        )}
                        <NeuroButton size="sm" onClick={() => {
                          setEditingTemplate(template);
                          setLayoutEditMode(true);
                          setShowTemplateSelector(false);
                        }}>
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </NeuroButton>
                        {!template.is_default && (
                          <NeuroButton size="sm" onClick={() => {
                            if (window.confirm(`Delete template "${template.view_name}"?`)) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </NeuroButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NeuroCard>
        </div>
      </div>
    );
  }

  if (layoutEditMode && currentUser?.role === 'admin') {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <NeuroCard>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#666" }}>
              {editingTemplate ? `Edit Template: ${editingTemplate.view_name}` : 'Create New Template'}
            </h2>
            <ViewLayoutEditor
              currentView={editingTemplate}
              onSave={(config) => saveViewMutation.mutate(config)}
              onCancel={() => {
                setLayoutEditMode(false);
                setEditingTemplate(null);
              }}
            />
          </NeuroCard>
        </div>
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#666" }}>
              Edit Contact
            </h2>
            <ContactForm
              contact={contact}
              onSubmit={(data) => updateMutation.mutate(data)}
              onCancel={() => setEditMode(false)}
              currentUser={currentUser}
            />
          </NeuroCard>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("Contacts"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                {contact.first_name} {contact.last_name}
              </h1>
              <p style={{ color: "#888" }}>
                {contact.job_title} {contact.job_title && company && '•'} {company?.company_name}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {currentUser?.role === 'admin' && (
              <NeuroButton onClick={() => setShowTemplateSelector(true)}>
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Manage Templates
              </NeuroButton>
            )}
            <NeuroButton onClick={() => setEditMode(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </NeuroButton>
            <NeuroButton variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </NeuroButton>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info - Dynamic Layout */}
          <div className="lg:col-span-2 space-y-6">
            {!activeView ? (
              <NeuroCard>
                <div className="text-center py-12">
                  <p className="mb-4" style={{ color: "#888" }}>No view template found</p>
                  {currentUser?.role === 'admin' && (
                    <NeuroButton variant="primary" onClick={handleCreateDefaultTemplate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Default Template
                    </NeuroButton>
                  )}
                </div>
              </NeuroCard>
            ) : (
              <>
                {activeView.sections?.map((section) => (
                  <NeuroCard key={section.id}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                      {section.title}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {section.fields.map((field) => (
                        <div key={field.name}>
                          <p className="text-sm mb-1" style={{ color: "#aaa" }}>{field.label}</p>
                          {renderFieldByType(field, contact[field.name], null, false)}
                        </div>
                      ))}
                    </div>
                  </NeuroCard>
                ))}

                {/* Custom Fields Section */}
                {activeView.custom_fields?.length > 0 && (
                  <NeuroCard>
                    <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                      Custom Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {activeView.custom_fields.map((field) => (
                        <div key={field.name}>
                          <p className="text-sm mb-1" style={{ color: "#aaa" }}>{field.label}</p>
                          {renderFieldByType(field, contact?.custom_data?.[field.name], null, false)}
                        </div>
                      ))}
                    </div>
                  </NeuroCard>
                )}
              </>
            )}

            {/* Associated Company */}
            {company && (
              <NeuroCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                    Company
                  </h2>
                  <Building2 className="w-5 h-5" style={{ color: "#888" }} />
                </div>
                <div
                  onClick={() => navigate(createPageUrl("CompanyDetail") + `?id=${company.id}`)}
                  className="neuro-inset p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <p className="font-bold mb-1" style={{ color: "#666" }}>{company.company_name}</p>
                  <p className="text-sm" style={{ color: "#888" }}>{company.industry}</p>
                </div>
              </NeuroCard>
            )}

            {/* Associated Deals */}
            <NeuroCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                  Deals ({deals.length})
                </h2>
                <NeuroButton size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Deal
                </NeuroButton>
              </div>
              {deals.length === 0 ? (
                <p className="text-center py-4" style={{ color: "#aaa" }}>No deals</p>
              ) : (
                <div className="space-y-3">
                  {deals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => navigate(createPageUrl("DealDetail") + `?id=${deal.id}`)}
                      className="neuro-inset p-4 rounded-lg cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold mb-1" style={{ color: "#666" }}>{deal.deal_name}</p>
                          <p className="text-sm" style={{ color: "#888" }}>{deal.deal_stage}</p>
                        </div>
                        <p className="font-bold" style={{ color: "#4a90e2" }}>
                          ${(deal.deal_amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </NeuroCard>

            {/* Activity Timeline */}
            <ActivityTimeline
              activities={activities}
              relatedType="Contact"
              relatedId={contactId}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>Quick Actions</h3>
              <div className="space-y-2">
                <NeuroButton className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Activity
                </NeuroButton>
                <NeuroButton className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </NeuroButton>
                <NeuroButton className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Deal
                </NeuroButton>
              </div>
            </NeuroCard>

            {/* Tasks */}
            <TaskList
              tasks={tasks}
              relatedType="Contact"
              relatedId={contactId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}