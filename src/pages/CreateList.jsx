import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import { toast } from "../components/crm/useToast";

export default function CreateList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listId, setListId] = useState(null);
  const [formData, setFormData] = useState({
    list_name: "",
    description: "",
    list_type: "Static",
    filter_criteria: {}
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setListId(id);
  }, []);

  const { data: list } = useQuery({
    queryKey: ['list', listId],
    queryFn: () => base44.entities.Contact_List.filter({ id: listId }),
    enabled: !!listId,
    select: (data) => data[0]
  });

  useEffect(() => {
    if (list) {
      setFormData({
        list_name: list.list_name || "",
        description: list.description || "",
        list_type: list.list_type || "Static",
        filter_criteria: list.filter_criteria || {}
      });
    }
  }, [list]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (listId) {
        return base44.entities.Contact_List.update(listId, data);
      } else {
        return base44.entities.Contact_List.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contact_lists']);
      toast.success(listId ? 'List updated successfully' : 'List created successfully');
      navigate(createPageUrl("ContactLists"));
    },
    onError: (error) => {
      toast.error('Failed to save list: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("ContactLists"))}>
            <ArrowLeft className="w-4 h-4" />
          </NeuroButton>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
              {listId ? 'Edit List' : 'Create List'}
            </h1>
            <p style={{ color: "#888" }}>Build your contact list</p>
          </div>
        </div>

        <NeuroCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <NeuroInput
              label="List Name"
              value={formData.list_name}
              onChange={(e) => setFormData({ ...formData, list_name: e.target.value })}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#666" }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="neuro-input w-full min-h-[100px]"
                placeholder="Describe this list..."
              />
            </div>

            <NeuroSelect
              label="List Type"
              value={formData.list_type}
              onChange={(e) => setFormData({ ...formData, list_type: e.target.value })}
              options={[
                { value: 'Static', label: 'Static - Manually add contacts' },
                { value: 'Dynamic', label: 'Dynamic - Auto-update based on rules' }
              ]}
            />

            {formData.list_type === 'Dynamic' && (
              <div className="neuro-inset p-4 rounded-lg">
                <p className="text-sm mb-2" style={{ color: "#666" }}>
                  Dynamic List Filters:
                </p>
                <p className="text-xs" style={{ color: "#aaa" }}>
                  Filter builder coming soon. Contacts will be automatically added/removed based on criteria.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <NeuroButton type="button" onClick={() => navigate(createPageUrl("ContactLists"))}>
                Cancel
              </NeuroButton>
              <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isLoading ? 'Saving...' : 'Save List'}
              </NeuroButton>
            </div>
          </form>
        </NeuroCard>
      </div>
    </div>
  );
}