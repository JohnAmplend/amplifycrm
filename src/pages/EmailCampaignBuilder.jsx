import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Send, Eye, Users, Mail, Calendar, Target, Sparkles, Plus, X } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import ReactQuill from 'react-quill';

export default function EmailCampaignBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [campaignId, setCampaignId] = useState(null);
  const [activeStep, setActiveStep] = useState(1); // 1: Details, 2: Recipients, 3: Content, 4: Schedule

  const [campaignData, setCampaignData] = useState({
    campaign_name: "",
    subject_line: "",
    from_name: "",
    from_email: "",
    reply_to_email: "",
    campaign_type: "One-Time Blast",
    status: "Draft",
    send_date: "",
    contact_list_id: "",
    segment_filters: [],
    email_body: "",
    template_id: ""
  });

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setCampaignId(id);
    }
  }, []);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const campaigns = await base44.entities.Email_Campaign.filter({ id: campaignId });
      return campaigns[0];
    },
    enabled: !!campaignId
  });

  const { data: contactLists = [] } = useQuery({
    queryKey: ['contact-lists'],
    queryFn: () => base44.entities.Contact_List.list()
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.Email_Template.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  useEffect(() => {
    if (campaign) {
      setCampaignData({
        campaign_name: campaign.campaign_name || "",
        subject_line: campaign.subject_line || "",
        from_name: campaign.from_name || "",
        from_email: campaign.from_email || "",
        reply_to_email: campaign.reply_to_email || "",
        campaign_type: campaign.campaign_type || "One-Time Blast",
        status: campaign.status || "Draft",
        send_date: campaign.send_date || "",
        contact_list_id: campaign.contact_list_id || "",
        segment_filters: campaign.custom_data?.segment_filters || [],
        email_body: campaign.email_body || "",
        template_id: campaign.template_id || ""
      });
    }
  }, [campaign]);

  // Calculate recipient count
  const getRecipientCount = () => {
    if (!campaignData.contact_list_id) return 0;
    
    // Filter by list
    let recipients = contacts.filter(c => {
      // Check if contact is in selected list (simplified - would need list membership check)
      return true;
    });

    // Apply segment filters
    campaignData.segment_filters.forEach(filter => {
      recipients = recipients.filter(contact => {
        const value = contact[filter.field];
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'not_equals':
            return value !== filter.value;
          case 'contains':
            return value?.toString().includes(filter.value);
          default:
            return true;
        }
      });
    });

    return recipients.length;
  };

  const saveMutation = useMutation({
    mutationFn: async (status) => {
      const dataToSave = {
        ...campaignData,
        status: status || campaignData.status,
        custom_data: {
          segment_filters: campaignData.segment_filters
        }
      };

      if (campaignId) {
        return await base44.entities.Email_Campaign.update(campaignId, dataToSave);
      } else {
        const newCampaign = await base44.entities.Email_Campaign.create(dataToSave);
        setCampaignId(newCampaign.id);
        return newCampaign;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['campaigns']);
      queryClient.invalidateQueries(['campaign', campaignId]);
    }
  });

  const handleSave = async (status) => {
    await saveMutation.mutateAsync(status);
    if (status === 'Scheduled' || status === 'Sending') {
      alert('Campaign saved and scheduled!');
      navigate(createPageUrl("Campaigns"));
    } else {
      alert('Campaign saved as draft!');
    }
  };

  const addSegmentFilter = () => {
    setCampaignData({
      ...campaignData,
      segment_filters: [
        ...campaignData.segment_filters,
        { field: 'lifecycle_stage', operator: 'equals', value: '' }
      ]
    });
  };

  const updateSegmentFilter = (index, updates) => {
    const newFilters = [...campaignData.segment_filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setCampaignData({ ...campaignData, segment_filters: newFilters });
  };

  const removeSegmentFilter = (index) => {
    setCampaignData({
      ...campaignData,
      segment_filters: campaignData.segment_filters.filter((_, i) => i !== index)
    });
  };

  if (isLoading && campaignId) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#f5f7fa' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: "#666" }}>Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f5f7fa' }}>
      {/* Top Bar */}
      <div className="bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(createPageUrl("Campaigns"))} className="p-2 rounded hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" style={{ color: "#6b7280" }} />
            </button>
            <div>
              <input
                type="text"
                value={campaignData.campaign_name}
                onChange={(e) => setCampaignData({ ...campaignData, campaign_name: e.target.value })}
                placeholder="Campaign Name"
                className="text-xl font-semibold bg-transparent border-none outline-none"
                style={{ color: "#111827", minWidth: "300px" }}
              />
              <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                {campaignId ? 'Draft saved' : 'Not saved yet'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <NeuroButton onClick={() => setPreviewMode(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </NeuroButton>
            <NeuroButton onClick={() => handleSave('Draft')}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => handleSave(campaignData.send_date ? 'Scheduled' : 'Sending')}>
              <Send className="w-4 h-4 mr-2" />
              {campaignData.send_date ? 'Schedule' : 'Send Now'}
            </NeuroButton>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex px-6 py-4 border-t" style={{ borderColor: "#e5e7eb" }}>
          {[
            { num: 1, label: 'Details', icon: Mail },
            { num: 2, label: 'Recipients', icon: Users },
            { num: 3, label: 'Content', icon: Mail },
            { num: 4, label: 'Schedule', icon: Calendar }
          ].map((step) => (
            <button
              key={step.num}
              onClick={() => setActiveStep(step.num)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeStep === step.num
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <step.icon className="w-4 h-4" />
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Details */}
          {activeStep === 1 && (
            <NeuroCard className="p-6">
              <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>Campaign Details</h2>
              
              <div className="space-y-6">
                <NeuroInput
                  label="Campaign Name"
                  value={campaignData.campaign_name}
                  onChange={(e) => setCampaignData({ ...campaignData, campaign_name: e.target.value })}
                  placeholder="e.g., Monthly Newsletter - January 2024"
                  required
                />

                <NeuroInput
                  label="Subject Line"
                  value={campaignData.subject_line}
                  onChange={(e) => setCampaignData({ ...campaignData, subject_line: e.target.value })}
                  placeholder="Engaging subject line here..."
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <NeuroInput
                    label="From Name"
                    value={campaignData.from_name}
                    onChange={(e) => setCampaignData({ ...campaignData, from_name: e.target.value })}
                    placeholder="Your Company"
                    required
                  />

                  <NeuroInput
                    label="From Email"
                    type="email"
                    value={campaignData.from_email}
                    onChange={(e) => setCampaignData({ ...campaignData, from_email: e.target.value })}
                    placeholder="hello@company.com"
                    required
                  />
                </div>

                <NeuroInput
                  label="Reply-To Email"
                  type="email"
                  value={campaignData.reply_to_email}
                  onChange={(e) => setCampaignData({ ...campaignData, reply_to_email: e.target.value })}
                  placeholder="support@company.com"
                />

                <NeuroSelect
                  label="Campaign Type"
                  value={campaignData.campaign_type}
                  onChange={(e) => setCampaignData({ ...campaignData, campaign_type: e.target.value })}
                  options={[
                    { value: 'One-Time Blast', label: 'One-Time Blast' },
                    { value: 'A/B Test', label: 'A/B Test' },
                    { value: 'Recurring', label: 'Recurring' }
                  ]}
                />

                <div className="flex justify-end pt-4">
                  <NeuroButton variant="primary" onClick={() => setActiveStep(2)}>
                    Next: Recipients →
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          )}

          {/* Step 2: Recipients */}
          {activeStep === 2 && (
            <NeuroCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: "#111827" }}>Select Recipients</h2>
                <div className="flex items-center gap-2 ampvibe-inset px-4 py-2 rounded-lg">
                  <Users className="w-4 h-4" style={{ color: "#0066cc" }} />
                  <span className="font-bold" style={{ color: "#111827" }}>
                    {getRecipientCount()} recipients
                  </span>
                </div>
              </div>
              
              <div className="space-y-6">
                <NeuroSelect
                  label="Contact List"
                  value={campaignData.contact_list_id}
                  onChange={(e) => setCampaignData({ ...campaignData, contact_list_id: e.target.value })}
                  options={contactLists.map(list => ({ value: list.id, label: list.list_name }))}
                  required
                />

                {/* Segmentation Filters */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium" style={{ color: "#374151" }}>
                      Segment Filters (Optional)
                    </label>
                    <NeuroButton size="sm" onClick={addSegmentFilter}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Filter
                    </NeuroButton>
                  </div>

                  {campaignData.segment_filters.length > 0 && (
                    <div className="space-y-3">
                      {campaignData.segment_filters.map((filter, index) => (
                        <div key={index} className="flex gap-2 items-start p-3 border rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            <select
                              value={filter.field}
                              onChange={(e) => updateSegmentFilter(index, { field: e.target.value })}
                              className="ampvibe-input text-sm"
                            >
                              <option value="lifecycle_stage">Lifecycle Stage</option>
                              <option value="lead_status">Lead Status</option>
                              <option value="city">City</option>
                              <option value="country">Country</option>
                              <option value="job_title">Job Title</option>
                            </select>

                            <select
                              value={filter.operator}
                              onChange={(e) => updateSegmentFilter(index, { operator: e.target.value })}
                              className="ampvibe-input text-sm"
                            >
                              <option value="equals">Equals</option>
                              <option value="not_equals">Not Equals</option>
                              <option value="contains">Contains</option>
                            </select>

                            <input
                              type="text"
                              value={filter.value}
                              onChange={(e) => updateSegmentFilter(index, { value: e.target.value })}
                              placeholder="Value"
                              className="ampvibe-input text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeSegmentFilter(index)}
                            className="p-2 rounded hover:bg-red-50"
                            style={{ color: "#dc2626" }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <NeuroButton onClick={() => setActiveStep(1)}>
                    ← Back
                  </NeuroButton>
                  <NeuroButton variant="primary" onClick={() => setActiveStep(3)}>
                    Next: Content →
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          )}

          {/* Step 3: Content */}
          {activeStep === 3 && (
            <NeuroCard className="p-6">
              <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>Email Content</h2>
              
              <div className="space-y-6">
                <NeuroSelect
                  label="Use Template (Optional)"
                  value={campaignData.template_id}
                  onChange={(e) => {
                    setCampaignData({ ...campaignData, template_id: e.target.value });
                    const template = emailTemplates.find(t => t.id === e.target.value);
                    if (template) {
                      setCampaignData({
                        ...campaignData,
                        template_id: e.target.value,
                        email_body: template.email_body,
                        subject_line: template.subject_line || campaignData.subject_line
                      });
                    }
                  }}
                  options={emailTemplates.map(t => ({ value: t.id, label: t.template_name }))}
                />

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
                    Email Body
                  </label>
                  <ReactQuill
                    value={campaignData.email_body}
                    onChange={(value) => setCampaignData({ ...campaignData, email_body: value })}
                    theme="snow"
                    style={{ height: '400px', marginBottom: '50px' }}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <NeuroButton onClick={() => setActiveStep(2)}>
                    ← Back
                  </NeuroButton>
                  <NeuroButton variant="primary" onClick={() => setActiveStep(4)}>
                    Next: Schedule →
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          )}

          {/* Step 4: Schedule */}
          {activeStep === 4 && (
            <NeuroCard className="p-6">
              <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>Schedule Campaign</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors" style={{ borderColor: "#e5e7eb" }}>
                    <input
                      type="radio"
                      name="send_timing"
                      checked={!campaignData.send_date}
                      onChange={() => setCampaignData({ ...campaignData, send_date: "" })}
                      className="w-4 h-4"
                      style={{ accentColor: "#0066cc" }}
                    />
                    <div>
                      <p className="font-medium" style={{ color: "#374151" }}>Send Immediately</p>
                      <p className="text-sm" style={{ color: "#9ca3af" }}>Campaign will be sent right away</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors" style={{ borderColor: "#e5e7eb" }}>
                    <input
                      type="radio"
                      name="send_timing"
                      checked={!!campaignData.send_date}
                      onChange={() => setCampaignData({ ...campaignData, send_date: new Date().toISOString().slice(0, 16) })}
                      className="w-4 h-4"
                      style={{ accentColor: "#0066cc" }}
                    />
                    <div className="flex-1">
                      <p className="font-medium mb-2" style={{ color: "#374151" }}>Schedule for Later</p>
                      {campaignData.send_date && (
                        <input
                          type="datetime-local"
                          value={campaignData.send_date ? new Date(campaignData.send_date).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setCampaignData({ ...campaignData, send_date: e.target.value })}
                          className="ampvibe-input text-sm"
                        />
                      )}
                    </div>
                  </label>
                </div>

                {/* Campaign Summary */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold mb-3" style={{ color: "#0066cc" }}>Campaign Summary</h3>
                  <div className="space-y-2 text-sm">
                    <p><span style={{ color: "#6b7280" }}>Name:</span> <span style={{ color: "#374151" }} className="font-medium">{campaignData.campaign_name || 'Untitled'}</span></p>
                    <p><span style={{ color: "#6b7280" }}>Subject:</span> <span style={{ color: "#374151" }} className="font-medium">{campaignData.subject_line || 'No subject'}</span></p>
                    <p><span style={{ color: "#6b7280" }}>Recipients:</span> <span style={{ color: "#374151" }} className="font-medium">{getRecipientCount()} contacts</span></p>
                    <p><span style={{ color: "#6b7280" }}>Send Time:</span> <span style={{ color: "#374151" }} className="font-medium">
                      {campaignData.send_date ? new Date(campaignData.send_date).toLocaleString() : 'Immediately'}
                    </span></p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <NeuroButton onClick={() => setActiveStep(3)}>
                    ← Back
                  </NeuroButton>
                  <NeuroButton variant="primary" onClick={() => handleSave(campaignData.send_date ? 'Scheduled' : 'Sending')}>
                    <Send className="w-4 h-4 mr-2" />
                    {campaignData.send_date ? 'Schedule Campaign' : 'Send Campaign'}
                  </NeuroButton>
                </div>
              </div>
            </NeuroCard>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#e5e7eb" }}>
              <h3 className="text-lg font-bold" style={{ color: "#111827" }}>Email Preview</h3>
              <button onClick={() => setPreviewMode(false)} className="p-2 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="mb-4 pb-4 border-b" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-sm mb-1" style={{ color: "#9ca3af" }}>From: {campaignData.from_name} &lt;{campaignData.from_email}&gt;</p>
                <p className="text-lg font-bold" style={{ color: "#111827" }}>Subject: {campaignData.subject_line}</p>
              </div>
              <div dangerouslySetInnerHTML={{ __html: campaignData.email_body }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}