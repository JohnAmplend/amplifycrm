import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Send, Eye } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import { toast } from "../components/crm/useToast";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [campaignId, setCampaignId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    campaign_name: "",
    subject_line: "",
    email_body: "",
    from_name: "",
    from_email: "",
    reply_to_email: "",
    campaign_type: "One-Time Blast",
    status: "Draft",
    send_date: "",
    contact_list_id: "",
    template_id: ""
  });

  useEffect(() => {
    base44.auth.me().then((user) => {
      setCurrentUser(user);
      setFormData(prev => ({
        ...prev,
        from_name: user.full_name || "",
        from_email: user.email || ""
      }));
    }).catch(() => {});
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setCampaignId(id);
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['email_templates'],
    queryFn: () => base44.entities.Email_Template.list()
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['contact_lists'],
    queryFn: () => base44.entities.Contact_List.list()
  });

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Email_Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (data) => data[0]
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        campaign_name: campaign.campaign_name || "",
        subject_line: campaign.subject_line || "",
        email_body: campaign.email_body || "",
        from_name: campaign.from_name || "",
        from_email: campaign.from_email || "",
        reply_to_email: campaign.reply_to_email || "",
        campaign_type: campaign.campaign_type || "One-Time Blast",
        status: campaign.status || "Draft",
        send_date: campaign.send_date || "",
        contact_list_id: campaign.contact_list_id || "",
        template_id: campaign.template_id || ""
      });
    }
  }, [campaign]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (campaignId) {
        return base44.entities.Email_Campaign.update(campaignId, data);
      } else {
        return base44.entities.Email_Campaign.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['email_campaigns']);
      toast.success(campaignId ? 'Campaign updated successfully' : 'Campaign created successfully');
      navigate(createPageUrl("Campaigns"));
    },
    onError: (error) => {
      toast.error('Failed to save campaign: ' + error.message);
    }
  });

  const handleSubmit = (e, sendNow = false) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      status: sendNow ? "Sending" : formData.status
    };
    saveMutation.mutate(dataToSave);
  };

  const loadTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        template_id: templateId,
        subject_line: template.subject_line || "",
        email_body: template.email_body || ""
      });
    }
  };

  const selectedList = lists.find(l => l.id === formData.contact_list_id);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("Campaigns"))}>
            <ArrowLeft className="w-4 h-4" />
          </NeuroButton>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
              {campaignId ? 'Edit Campaign' : 'Create Campaign'}
            </h1>
            <p style={{ color: "#888" }}>Design and send your email campaign</p>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <NeuroCard>
                <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                  Campaign Details
                </h2>
                <div className="space-y-6">
                  <NeuroInput
                    label="Campaign Name"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <NeuroInput
                      label="From Name"
                      value={formData.from_name}
                      onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    />
                    <NeuroInput
                      label="From Email"
                      type="email"
                      value={formData.from_email}
                      onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    />
                  </div>

                  <NeuroInput
                    label="Reply-To Email"
                    type="email"
                    value={formData.reply_to_email}
                    onChange={(e) => setFormData({ ...formData, reply_to_email: e.target.value })}
                  />
                </div>
              </NeuroCard>

              <NeuroCard>
                <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                  Email Content
                </h2>
                <div className="space-y-6">
                  <NeuroSelect
                    label="Use Template (Optional)"
                    value={formData.template_id}
                    onChange={(e) => loadTemplate(e.target.value)}
                    options={templates.map(t => ({ value: t.id, label: t.template_name }))}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: "#666" }}>
                      Subject Line <span style={{ color: "#f5222d" }}>*</span>
                    </label>
                    <input
                      value={formData.subject_line}
                      onChange={(e) => setFormData({ ...formData, subject_line: e.target.value })}
                      className="neuro-input w-full"
                      placeholder="Enter subject line..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: "#666" }}>
                      Email Body <span style={{ color: "#f5222d" }}>*</span>
                    </label>
                    <textarea
                      value={formData.email_body}
                      onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                      className="neuro-input w-full min-h-[300px] font-mono text-sm"
                      placeholder="Write your email content..."
                      required
                    />
                  </div>
                </div>
              </NeuroCard>
            </div>

            <div className="space-y-6">
              <NeuroCard>
                <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                  Recipients
                </h3>
                <div className="space-y-4">
                  <NeuroSelect
                    label="Contact List"
                    value={formData.contact_list_id}
                    onChange={(e) => setFormData({ ...formData, contact_list_id: e.target.value })}
                    options={lists.map(l => ({ value: l.id, label: l.list_name }))}
                    required
                  />

                  {selectedList && (
                    <div className="neuro-inset p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold" style={{ color: "#666" }}>
                        {selectedList.total_contacts || 0}
                      </p>
                      <p className="text-sm" style={{ color: "#aaa" }}>
                        Recipients
                      </p>
                    </div>
                  )}
                </div>
              </NeuroCard>

              <NeuroCard>
                <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                  Schedule
                </h3>
                <div className="space-y-4">
                  <NeuroInput
                    label="Send Date (Optional)"
                    type="datetime-local"
                    value={formData.send_date}
                    onChange={(e) => setFormData({ ...formData, send_date: e.target.value })}
                  />
                </div>
              </NeuroCard>

              <div className="flex flex-col gap-3">
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isLoading ? 'Saving...' : 'Save Draft'}
                </NeuroButton>
                <NeuroButton
                  type="button"
                  variant="success"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={saveMutation.isLoading || !formData.contact_list_id}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {saveMutation.isLoading ? 'Sending...' : formData.send_date ? 'Schedule' : 'Send Now'}
                </NeuroButton>
                <NeuroButton type="button" onClick={() => navigate(createPageUrl("Campaigns"))}>
                  Cancel
                </NeuroButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}