import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Edit2, Trash2, Code, Copy, Eye } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function Forms() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState("");

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: () => base44.entities.Form.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Form.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['forms']);
    }
  });

  const filteredForms = forms.filter(form => {
    return !filterType || form.form_type === filterType;
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Forms
            </h1>
            <p style={{ color: "#888" }}>Create and manage web forms for your website</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("FormBuilder"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create Form
          </NeuroButton>
        </div>

        {/* Filter */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              placeholder="Filter by type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'Contact Form', label: 'Contact Form' },
                { value: 'Lead Form', label: 'Lead Form' },
                { value: 'Ticket Form', label: 'Ticket Form' },
                { value: 'Newsletter', label: 'Newsletter' },
                { value: 'Custom', label: 'Custom' }
              ]}
            />
          </div>
        </NeuroCard>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12" style={{ color: "#aaa" }}>
              Loading forms...
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>No forms found</p>
              <NeuroButton onClick={() => navigate(createPageUrl("FormBuilder"))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Form
              </NeuroButton>
            </div>
          ) : (
            filteredForms.map((form) => (
              <NeuroCard key={form.id} className="hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: "#666" }}>
                      {form.form_name}
                    </h3>
                    {form.form_description && (
                      <p className="text-sm mb-2" style={{ color: "#888" }}>
                        {form.form_description.substring(0, 100)}...
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <span className="ampvibe-button px-2 py-1 text-xs">
                        {form.form_type}
                      </span>
                      <span className={`ampvibe-button px-2 py-1 text-xs ${
                        form.is_active ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="ampvibe-inset p-3 rounded-lg text-center">
                      <p className="text-xs" style={{ color: "#888" }}>Submissions</p>
                      <p className="text-xl font-bold" style={{ color: "#4a90e2" }}>
                        {form.submissions_count || 0}
                      </p>
                    </div>
                    <div className="ampvibe-inset p-3 rounded-lg text-center">
                      <p className="text-xs" style={{ color: "#888" }}>Action</p>
                      <p className="text-xs font-medium" style={{ color: "#666" }}>
                        {form.submit_action}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <NeuroButton
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(createPageUrl("FormBuilder") + `?id=${form.id}`)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(createPageUrl("FormSubmissions") + `?form=${form.id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Submissions
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Delete this form?')) {
                          deleteMutation.mutate(form.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </NeuroButton>
                  </div>
                </div>
              </NeuroCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}