import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Edit2, Trash2, Plus, Building2, DollarSign } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import ContactForm from "../components/crm/ContactForm";
import ActivityTimeline from "../components/crm/ActivityTimeline";
import TaskList from "../components/crm/TaskList";

export default function ContactDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contactId, setContactId] = useState(null);
  const [editMode, setEditMode] = useState(false);
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

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.update(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact', contactId]);
      setEditMode(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Contact.delete(contactId),
    onSuccess: () => {
      navigate(createPageUrl("Contacts"));
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate();
    }
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
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Details */}
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Contact Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Email</p>
                  <p style={{ color: "#666" }}>{contact.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Phone</p>
                  <p style={{ color: "#666" }}>{contact.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Mobile</p>
                  <p style={{ color: "#666" }}>{contact.mobile || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Department</p>
                  <p style={{ color: "#666" }}>{contact.department || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Lifecycle Stage</p>
                  <span className="neuro-button px-2 py-1 text-sm">{contact.lifecycle_stage}</span>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Lead Status</p>
                  <span className="neuro-button px-2 py-1 text-sm">{contact.lead_status}</span>
                </div>
                {contact.address && (
                  <div className="col-span-2">
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Address</p>
                    <p style={{ color: "#666" }}>
                      {contact.address}, {contact.city}, {contact.state} {contact.zip}
                    </p>
                  </div>
                )}
              </div>
            </NeuroCard>

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