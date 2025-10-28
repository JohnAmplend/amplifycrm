import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Eye } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    template_name: "",
    subject_line: "",
    email_body: "",
    template_type: "Marketing",
    category: "",
    is_active: true
  });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setTemplateId(id);
  }, []);

  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => base44.entities.Email_Template.filter({ id: templateId }),
    enabled: !!templateId,
    select: (data) => data[0]
  });

  useEffect(() => {
    if (template) {
      setFormData({
        template_name: template.template_name || "",
        subject_line: template.subject_line || "",
        email_body: template.email_body || "",
        template_type: template.template_type || "Marketing",
        category: template.category || "",
        is_active: template.is_active !== false
      });
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (templateId) {
        return base44.entities.Email_Template.update(templateId, data);
      } else {
        return base44.entities.Email_Template.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['email_templates']);
      navigate(createPageUrl("EmailTemplates"));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const insertToken = (token) => {
    setFormData({
      ...formData,
      email_body: formData.email_body + ` {{${token}}}`
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("EmailTemplates"))}>
            <ArrowLeft className="w-4 h-4" />
          </NeuroButton>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
              {templateId ? 'Edit Template' : 'Create Template'}
            </h1>
            <p style={{ color: "#888" }}>Design your email template</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Editor */}
            <div className="lg:col-span-2 space-y-6">
              <NeuroCard>
                <div className="space-y-6">
                  <NeuroInput
                    label="Template Name"
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                    required
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
                    <div className="flex gap-2 flex-wrap">
                      {['first_name', 'last_name', 'company_name', 'job_title'].map(token => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            subject_line: formData.subject_line + ` {{${token}}}`
                          })}
                          className="neuro-button px-2 py-1 text-xs"
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: "#666" }}>
                      Email Body <span style={{ color: "#f5222d" }}>*</span>
                    </label>
                    <textarea
                      value={formData.email_body}
                      onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                      className="neuro-input w-full min-h-[400px] font-mono text-sm"
                      placeholder="Write your email content here...

You can use tokens like {{first_name}}, {{last_name}}, {{company_name}}, etc."
                      required
                    />
                    <div className="flex gap-2 flex-wrap">
                      {['first_name', 'last_name', 'company_name', 'job_title', 'email', 'phone'].map(token => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => insertToken(token)}
                          className="neuro-button px-2 py-1 text-xs"
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </NeuroCard>
            </div>

            {/* Settings Sidebar */}
            <div className="space-y-6">
              <NeuroCard>
                <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                  Template Settings
                </h3>
                <div className="space-y-4">
                  <NeuroSelect
                    label="Template Type"
                    value={formData.template_type}
                    onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                    options={[
                      { value: 'Marketing', label: 'Marketing' },
                      { value: 'Sales', label: 'Sales' },
                      { value: 'Support', label: 'Support' },
                      { value: 'Automated', label: 'Automated' }
                    ]}
                  />

                  <NeuroInput
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Newsletter, Welcome"
                  />

                  <div className="neuro-inset p-4 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="neuro-button w-5 h-5"
                      />
                      <span style={{ color: "#666" }}>Active Template</span>
                    </label>
                  </div>
                </div>
              </NeuroCard>

              <div className="flex flex-col gap-3">
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isLoading ? 'Saving...' : 'Save Template'}
                </NeuroButton>
                <NeuroButton type="button" onClick={() => navigate(createPageUrl("EmailTemplates"))}>
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