import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Eye, Edit2, Copy, Trash2, Mail } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function EmailTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email_templates'],
    queryFn: () => base44.entities.Email_Template.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Email_Template.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['email_templates']);
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete template: ' + error.message);
    }
  });

  const cloneMutation = useMutation({
    mutationFn: async (template) => {
      const { id, created_date, updated_date, created_by, ...data } = template;
      return base44.entities.Email_Template.create({
        ...data,
        template_name: `${data.template_name} (Copy)`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['email_templates']);
    }
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || template.template_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (template) => {
    if (window.confirm(`Delete template "${template.template_name}"?`)) {
      deleteMutation.mutate(template.id);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Email Templates
            </h1>
            <p style={{ color: "#888" }}>Create and manage email templates</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("TemplateBuilder"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </NeuroButton>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neuro-input w-full pl-12"
              />
            </div>
            <NeuroSelect
              placeholder="Filter by type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Sales', label: 'Sales' },
                { value: 'Support', label: 'Support' },
                { value: 'Automated', label: 'Automated' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Templates Grid */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No templates found</p>
              <NeuroButton onClick={() => navigate(createPageUrl("TemplateBuilder"))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </NeuroButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="neuro-inset p-5 rounded-lg">
                  <div className="aspect-video neuro-card mb-4 flex items-center justify-center">
                    <Mail className="w-12 h-12" style={{ color: "#ccc" }} />
                  </div>
                  <div className="mb-3">
                    <h3 className="font-bold mb-1" style={{ color: "#666" }}>
                      {template.template_name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="neuro-button px-2 py-1 text-xs">
                        {template.template_type}
                      </span>
                      {template.category && (
                        <span className="text-xs" style={{ color: "#888" }}>
                          {template.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <NeuroButton
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(createPageUrl("TemplateBuilder") + `?id=${template.id}`)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      onClick={() => cloneMutation.mutate(template)}
                    >
                      <Copy className="w-3 h-3" />
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </NeuroButton>
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