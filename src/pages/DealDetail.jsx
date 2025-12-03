import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import DealForm from "../components/crm/DealForm";
import ActivityTimeline from "../components/crm/ActivityTimeline.jsx";
import TaskList from "../components/crm/TaskList.jsx";
import ActivityTimelinePanel from "../components/crm/ActivityTimelinePanel";
import TaskManager from "../components/crm/TaskManager";

export default function DealDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dealId, setDealId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    setDealId(urlParams.get('id'));
  }, []);

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => base44.entities.Deal.filter({ id: dealId }),
    enabled: !!dealId,
    select: (data) => data[0]
  });

  const { data: contact } = useQuery({
    queryKey: ['contact', deal?.contact_id],
    queryFn: () => base44.entities.Contact.filter({ id: deal.contact_id }),
    enabled: !!deal?.contact_id,
    select: (data) => data[0]
  });

  const { data: company } = useQuery({
    queryKey: ['company', deal?.company_id],
    queryFn: () => base44.entities.Company.filter({ id: deal.company_id }),
    enabled: !!deal?.company_id,
    select: (data) => data[0]
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', dealId],
    queryFn: () => base44.entities.Activity.filter({ deal_id: dealId }, '-created_date'),
    enabled: !!dealId
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', dealId],
    queryFn: () => base44.entities.Task.filter({ related_to_type: 'Deal', related_to_id: dealId }),
    enabled: !!dealId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Deal.update(dealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deal', dealId]);
      setEditMode(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Deal.delete(dealId),
    onSuccess: () => {
      navigate(createPageUrl("Deals"));
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
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

  if (!deal) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Deal not found
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
              Edit Deal
            </h2>
            <DealForm
              deal={deal}
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
            <NeuroButton onClick={() => navigate(createPageUrl("Deals"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                {deal.deal_name}
              </h1>
              <p style={{ color: "#888" }}>
                ${(deal.deal_amount || 0).toLocaleString()} • {deal.deal_stage}
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
                Deal Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Amount</p>
                  <p className="text-xl font-bold" style={{ color: "#4a90e2" }}>
                    ${(deal.deal_amount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Close Date</p>
                  <p style={{ color: "#666" }}>
                    {deal.close_date ? new Date(deal.close_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Stage</p>
                  <span className="neuro-button px-2 py-1 text-sm">{deal.deal_stage}</span>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Probability</p>
                  <p style={{ color: "#666" }}>{deal.probability || 0}%</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Type</p>
                  <p style={{ color: "#666" }}>{deal.deal_type}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Priority</p>
                  <span className={`neuro-button px-2 py-1 text-sm ${
                    deal.priority === 'High' ? 'text-red-600' :
                    deal.priority === 'Medium' ? 'text-orange-600' : ''
                  }`}>
                    {deal.priority}
                  </span>
                </div>
                {deal.next_step && (
                  <div className="col-span-2">
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Next Step</p>
                    <p style={{ color: "#666" }}>{deal.next_step}</p>
                  </div>
                )}
              </div>
            </NeuroCard>

            {(contact || company) && (
              <NeuroCard>
                <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                  Associated Records
                </h2>
                {contact && (
                  <div
                    onClick={() => navigate(createPageUrl("ContactDetail") + `?id=${contact.id}`)}
                    className="neuro-inset p-4 rounded-lg cursor-pointer mb-3"
                  >
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Contact</p>
                    <p className="font-bold" style={{ color: "#666" }}>
                      {contact.first_name} {contact.last_name}
                    </p>
                    <p className="text-sm" style={{ color: "#888" }}>{contact.email}</p>
                  </div>
                )}
                {company && (
                  <div
                    onClick={() => navigate(createPageUrl("CompanyDetail") + `?id=${company.id}`)}
                    className="neuro-inset p-4 rounded-lg cursor-pointer"
                  >
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Company</p>
                    <p className="font-bold" style={{ color: "#666" }}>{company.company_name}</p>
                    <p className="text-sm" style={{ color: "#888" }}>{company.industry}</p>
                  </div>
                )}
              </NeuroCard>
            )}

            {/* Comprehensive Activity Timeline */}
            <ActivityTimelinePanel
              objectType="Deal"
              objectId={dealId}
              objectName={deal.deal_name}
            />

            {/* Task Manager */}
            <TaskManager
              relatedToType="Deal"
              relatedToId={dealId}
              relatedToName={deal.deal_name}
            />
          </div>

          <div className="space-y-6">
            {/* Sidebar can include quick actions or summary cards */}
          </div>
        </div>
      </div>
    </div>
  );
}