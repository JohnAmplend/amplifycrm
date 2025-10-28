import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Edit2, Trash2, RefreshCw } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import LeadForm from "../components/crm/LeadForm";
import ActivityTimeline from "../components/crm/ActivityTimeline.jsx";

export default function LeadDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [leadId, setLeadId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [convertMode, setConvertMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [convertData, setConvertData] = useState({
    create_company: true,
    company_name: "",
    create_deal: false,
    deal_name: "",
    deal_amount: ""
  });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    setLeadId(urlParams.get('id'));
    if (urlParams.get('convert') === 'true') {
      setConvertMode(true);
    }
  }, []);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => base44.entities.Lead.filter({ id: leadId }),
    enabled: !!leadId,
    select: (data) => data[0]
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', leadId],
    queryFn: () => base44.entities.Activity.filter({ lead_id: leadId }, '-created_date'),
    enabled: !!leadId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', leadId]);
      setEditMode(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Lead.delete(leadId),
    onSuccess: () => {
      navigate(createPageUrl("Leads"));
    }
  });

  const convertMutation = useMutation({
    mutationFn: async (data) => {
      let companyId = null;
      
      // Create company if needed
      if (data.create_company && data.company_name) {
        const company = await base44.entities.Company.create({
          company_name: data.company_name,
          company_owner: lead.lead_owner || currentUser?.email
        });
        companyId = company.id;
      }
      
      // Create contact
      const contact = await base44.entities.Contact.create({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        job_title: lead.job_title,
        company_id: companyId,
        contact_owner: lead.lead_owner || currentUser?.email,
        lifecycle_stage: "Opportunity"
      });
      
      // Create deal if requested
      if (data.create_deal && data.deal_name) {
        await base44.entities.Deal.create({
          deal_name: data.deal_name,
          deal_amount: parseFloat(data.deal_amount) || 0,
          deal_stage: "Qualified",
          contact_id: contact.id,
          company_id: companyId,
          deal_owner: lead.lead_owner || currentUser?.email
        });
      }
      
      // Update lead as converted
      await base44.entities.Lead.update(leadId, {
        lead_status: "Converted",
        converted_contact_id: contact.id,
        converted_date: new Date().toISOString()
      });
      
      return contact.id;
    },
    onSuccess: (contactId) => {
      queryClient.invalidateQueries(['lead', leadId]);
      navigate(createPageUrl("ContactDetail") + `?id=${contactId}`);
    }
  });

  useEffect(() => {
    if (lead && convertMode) {
      setConvertData({
        ...convertData,
        company_name: lead.company_name || ""
      });
    }
  }, [lead, convertMode]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate();
    }
  };

  const handleConvert = () => {
    convertMutation.mutate(convertData);
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

  if (!lead) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Lead not found
        </div>
      </div>
    );
  }

  if (convertMode) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
              Convert Lead to Contact
            </h2>
            <p className="mb-6" style={{ color: "#888" }}>
              Converting: {lead.first_name} {lead.last_name}
            </p>
            
            <div className="space-y-6">
              <div className="neuro-inset p-4 rounded-lg">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={convertData.create_company}
                    onChange={(e) => setConvertData({ ...convertData, create_company: e.target.checked })}
                    className="neuro-button"
                  />
                  <span className="font-medium" style={{ color: "#666" }}>Create Company</span>
                </label>
                {convertData.create_company && (
                  <NeuroInput
                    label="Company Name"
                    value={convertData.company_name}
                    onChange={(e) => setConvertData({ ...convertData, company_name: e.target.value })}
                    className="mt-4"
                    required
                  />
                )}
              </div>

              <div className="neuro-inset p-4 rounded-lg">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={convertData.create_deal}
                    onChange={(e) => setConvertData({ ...convertData, create_deal: e.target.checked })}
                    className="neuro-button"
                  />
                  <span className="font-medium" style={{ color: "#666" }}>Create Deal</span>
                </label>
                {convertData.create_deal && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <NeuroInput
                      label="Deal Name"
                      value={convertData.deal_name}
                      onChange={(e) => setConvertData({ ...convertData, deal_name: e.target.value })}
                      required
                    />
                    <NeuroInput
                      label="Deal Amount"
                      type="number"
                      value={convertData.deal_amount}
                      onChange={(e) => setConvertData({ ...convertData, deal_amount: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <NeuroButton onClick={() => setConvertMode(false)}>
                  Cancel
                </NeuroButton>
                <NeuroButton variant="primary" onClick={handleConvert}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Convert Lead
                </NeuroButton>
              </div>
            </div>
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
              Edit Lead
            </h2>
            <LeadForm
              lead={lead}
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
            <NeuroButton onClick={() => navigate(createPageUrl("Leads"))}>
              <ArrowLeft className="w-4 h-4" />
            </NeuroButton>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                {lead.first_name} {lead.last_name}
              </h1>
              <p style={{ color: "#888" }}>
                {lead.job_title} {lead.job_title && lead.company_name && '•'} {lead.company_name}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {!lead.converted_contact_id && (
              <NeuroButton variant="primary" onClick={() => setConvertMode(true)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Convert to Contact
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
          <div className="lg:col-span-2 space-y-6">
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Lead Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Email</p>
                  <p style={{ color: "#666" }}>{lead.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Phone</p>
                  <p style={{ color: "#666" }}>{lead.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Lead Source</p>
                  <span className="neuro-button px-2 py-1 text-sm">{lead.lead_source}</span>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Lead Status</p>
                  <span className={`neuro-button px-2 py-1 text-sm ${
                    lead.lead_status === 'Converted' ? 'text-green-600' :
                    lead.lead_status === 'Qualified' ? 'text-blue-600' :
                    lead.lead_status === 'Unqualified' ? 'text-red-600' : ''
                  }`}>
                    {lead.lead_status}
                  </span>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: "#aaa" }}>Lead Score</p>
                  <p className="font-bold" style={{ color: "#666" }}>{lead.lead_score || 0}</p>
                </div>
                {lead.converted_contact_id && (
                  <div>
                    <p className="text-sm mb-1" style={{ color: "#aaa" }}>Converted Date</p>
                    <p style={{ color: "#666" }}>
                      {new Date(lead.converted_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </NeuroCard>

            <ActivityTimeline
              activities={activities}
              relatedType="Lead"
              relatedId={leadId}
            />
          </div>

          <div>
            {lead.converted_contact_id && (
              <NeuroCard>
                <h3 className="font-bold mb-3" style={{ color: "#666" }}>Converted</h3>
                <p className="text-sm mb-2" style={{ color: "#888" }}>
                  This lead has been converted to a contact.
                </p>
                <NeuroButton
                  className="w-full"
                  onClick={() => navigate(createPageUrl("ContactDetail") + `?id=${lead.converted_contact_id}`)}
                >
                  View Contact
                </NeuroButton>
              </NeuroCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}