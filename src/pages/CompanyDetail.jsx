import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Edit2, Trash2, Plus, Users, DollarSign } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import CompanyForm from "../components/crm/CompanyForm";
import ActivityTimeline from "../components/crm/ActivityTimeline.jsx";
import TaskList from "../components/crm/TaskList.jsx";

export default function CompanyDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [companyId, setCompanyId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    setCompanyId(urlParams.get('id'));
  }, []);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }),
    enabled: !!companyId,
    select: (data) => data[0]
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', companyId],
    queryFn: () => base44.entities.Contact.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', companyId],
    queryFn: () => base44.entities.Deal.filter({ company_id: companyId }),
    enabled: !!companyId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', companyId],
    queryFn: () => base44.entities.Activity.filter({ company_id: companyId }, '-created_date'),
    enabled: !!companyId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', companyId],
    queryFn: () => base44.entities.Task.filter({ related_to_type: 'Company', related_to_id: companyId }),
    enabled: !!companyId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.update(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['company', companyId]);
      setEditMode(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Company.delete(companyId),
    onSuccess: () => {
      navigate(createPageUrl("Companies"));
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this company?')) {
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

  if (!company) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Company not found
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
              Edit Company
            </h2>
            <CompanyForm
              company={company}
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeuroButton onClick={() => navigate(createPageUrl("Companies"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                {company.company_name}
              </h1>
              <p style={{ color: "#888" }}>
                {company.industry} {company.city && company.industry && '•'} {company.city}
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
          <div className="lg:col-span-2 space-y-6">
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Company Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Domain</p>
                  <p style={{ color: "#666" }}>{company.domain || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Phone</p>
                  <p style={{ color: "#666" }}>{company.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Employees</p>
                  <p style={{ color: "#666" }}>{company.number_of_employees || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Annual Revenue</p>
                  <p style={{ color: "#666" }}>
                    {company.annual_revenue ? `$${company.annual_revenue.toLocaleString()}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Lifecycle Stage</p>
                  <span className="neuro-button px-2 py-1 text-sm">{company.lifecycle_stage}</span>
                </div>
                {company.address && (
                  <div className="col-span-2">
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Address</p>
                    <p style={{ color: "#666" }}>
                      {company.address}, {company.city}, {company.state} {company.zip}
                    </p>
                  </div>
                )}
              </div>
            </NeuroCard>

            <NeuroCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                  Contacts ({contacts.length})
                </h2>
                <NeuroButton size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Contact
                </NeuroButton>
              </div>
              {contacts.length === 0 ? (
                <p className="text-center py-4" style={{ color: "#aaa" }}>No contacts</p>
              ) : (
                <div className="space-y-3">
                  {contacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => navigate(createPageUrl("ContactDetail") + `?id=${contact.id}`)}
                      className="neuro-inset p-4 rounded-lg cursor-pointer"
                    >
                      <p className="font-bold mb-1" style={{ color: "#666" }}>
                        {contact.first_name} {contact.last_name}
                      </p>
                      <p className="text-sm" style={{ color: "#888" }}>
                        {contact.job_title}
                      </p>
                      <p className="text-sm" style={{ color: "#aaa" }}>
                        {contact.email}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </NeuroCard>

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

            <ActivityTimeline
              activities={activities}
              relatedType="Company"
              relatedId={companyId}
            />
          </div>

          <div className="space-y-6">
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

            <TaskList
              tasks={tasks}
              relatedType="Company"
              relatedId={companyId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}