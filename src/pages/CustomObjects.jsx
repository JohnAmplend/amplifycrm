import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Edit2, Trash2, Box, Settings } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function CustomObjects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    object_name: "",
    object_label_singular: "",
    object_label_plural: "",
    object_icon: "Box",
    description: "",
    is_active: true,
    has_pipeline: false,
    pipeline_stages: []
  });

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: customObjects = [], isLoading } = useQuery({
    queryKey: ['custom_objects'],
    queryFn: () => base44.entities.Custom_Objects.list('-created_date')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingObject) {
        return base44.entities.Custom_Objects.update(editingObject.id, data);
      } else {
        return base44.entities.Custom_Objects.create({
          ...data,
          created_by: currentUser?.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['custom_objects']);
      setShowForm(false);
      setEditingObject(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Custom_Objects.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['custom_objects']);
    }
  });

  const resetForm = () => {
    setFormData({
      object_name: "",
      object_label_singular: "",
      object_label_plural: "",
      object_icon: "Box",
      description: "",
      is_active: true,
      has_pipeline: false,
      pipeline_stages: []
    });
  };

  const handleEdit = (obj) => {
    setEditingObject(obj);
    setFormData({
      object_name: obj.object_name,
      object_label_singular: obj.object_label_singular,
      object_label_plural: obj.object_label_plural,
      object_icon: obj.object_icon || "Box",
      description: obj.description || "",
      is_active: obj.is_active !== false,
      has_pipeline: obj.has_pipeline || false,
      pipeline_stages: obj.pipeline_stages || []
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Custom Objects
            </h1>
            <p style={{ color: "#888" }}>Create custom data structures for your business</p>
          </div>
          <NeuroButton 
            variant="primary" 
            onClick={() => { 
              setShowForm(true); 
              setEditingObject(null);
              resetForm();
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Object
          </NeuroButton>
        </div>

        {showForm && (
          <NeuroCard className="mb-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              {editingObject ? 'Edit Custom Object' : 'New Custom Object'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <NeuroInput
                  label="Object Name (Internal)"
                  value={formData.object_name}
                  onChange={(e) => setFormData({ ...formData, object_name: e.target.value })}
                  placeholder="e.g., projects"
                  required
                />
                <NeuroInput
                  label="Singular Label"
                  value={formData.object_label_singular}
                  onChange={(e) => setFormData({ ...formData, object_label_singular: e.target.value })}
                  placeholder="e.g., Project"
                  required
                />
              </div>
              <NeuroInput
                label="Plural Label"
                value={formData.object_label_plural}
                onChange={(e) => setFormData({ ...formData, object_label_plural: e.target.value })}
                placeholder="e.g., Projects"
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#333" }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="ampvibe-input w-full min-h-[100px]"
                  placeholder="Describe what this object is used for..."
                />
              </div>
              <div className="ampvibe-inset p-4 rounded-lg space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_pipeline}
                    onChange={(e) => setFormData({ ...formData, has_pipeline: e.target.checked })}
                    className="ampvibe-button w-5 h-5"
                  />
                  <div>
                    <span className="font-medium" style={{ color: "#666" }}>Enable Pipeline</span>
                    <p className="text-xs" style={{ color: "#888" }}>
                      Allow records to move through stages (like Deals)
                    </p>
                  </div>
                </label>
                {formData.has_pipeline && (
                  <NeuroInput
                    placeholder="Comma-separated stages (e.g., Planning, In Progress, Completed)"
                    value={formData.pipeline_stages.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      pipeline_stages: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                  />
                )}
              </div>
              <div className="flex justify-end gap-3">
                <NeuroButton 
                  type="button" 
                  onClick={() => { 
                    setShowForm(false); 
                    setEditingObject(null);
                    resetForm();
                  }}
                >
                  Cancel
                </NeuroButton>
                <NeuroButton type="submit" variant="primary" disabled={saveMutation.isLoading}>
                  {saveMutation.isLoading ? 'Saving...' : editingObject ? 'Update' : 'Create'} Object
                </NeuroButton>
              </div>
            </form>
          </NeuroCard>
        )}

        {/* Objects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12" style={{ color: "#aaa" }}>
              Loading custom objects...
            </div>
          ) : customObjects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Box className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No custom objects yet</p>
              <NeuroButton onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Custom Object
              </NeuroButton>
            </div>
          ) : (
            customObjects.map((obj) => (
              <NeuroCard key={obj.id} className="hover:shadow-xl transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="ampvibe-inset p-3 rounded-lg">
                        <Box className="w-6 h-6" style={{ color: "#4a90e2" }} />
                      </div>
                      <div>
                        <h3 className="font-bold" style={{ color: "#666" }}>
                          {obj.object_label_plural}
                        </h3>
                        <p className="text-xs" style={{ color: "#888" }}>
                          {obj.object_name}
                        </p>
                      </div>
                    </div>
                    <span className={`ampvibe-button px-2 py-1 text-xs ${
                      obj.is_active ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {obj.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {obj.description && (
                    <p className="text-sm" style={{ color: "#888" }}>
                      {obj.description.substring(0, 100)}
                      {obj.description.length > 100 && '...'}
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {obj.has_pipeline && (
                      <span className="ampvibe-button px-2 py-1 text-xs">
                        Has Pipeline
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                    <NeuroButton
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(obj)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(createPageUrl("CustomObjectRecords") + `?object=${obj.id}`)}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Manage
                    </NeuroButton>
                    <NeuroButton
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Delete ${obj.object_label_singular}? This will delete all records.`)) {
                          deleteMutation.mutate(obj.id);
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

        {/* Info Card */}
        <NeuroCard className="mt-6">
          <h3 className="font-bold mb-3" style={{ color: "#666" }}>
            What are Custom Objects?
          </h3>
          <p className="text-sm mb-3" style={{ color: "#888" }}>
            Custom Objects let you create your own data structures beyond the standard CRM objects (Contacts, Companies, Deals). 
            You can create objects for anything your business needs: Projects, Products, Assets, Inventory, etc.
          </p>
          <p className="text-sm" style={{ color: "#888" }}>
            After creating a Custom Object, you can add custom properties, create records, and associate them with other objects.
          </p>
        </NeuroCard>
      </div>
    </div>
  );
}