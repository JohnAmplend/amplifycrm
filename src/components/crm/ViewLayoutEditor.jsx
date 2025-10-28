import React, { useState } from "react";
import { Plus, X, GripVertical, Save, Edit2, Trash2 } from "lucide-react";
import NeuroButton from "./NeuroButton";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";
import NeuroCard from "./NeuroCard";

export default function ViewLayoutEditor({ currentView, onSave, onCancel }) {
  const [viewName, setViewName] = useState(currentView?.view_name || "Default View");
  const [sections, setSections] = useState(currentView?.sections || [
    {
      id: "section-1",
      title: "Contact Information",
      fields: [
        { name: "first_name", label: "First Name", type: "text", required: true },
        { name: "last_name", label: "Last Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: false },
        { name: "phone", label: "Phone", type: "text", required: false }
      ]
    },
    {
      id: "section-2",
      title: "Additional Details",
      fields: [
        { name: "job_title", label: "Job Title", type: "text", required: false },
        { name: "department", label: "Department", type: "text", required: false },
        { name: "lifecycle_stage", label: "Lifecycle Stage", type: "select", required: false },
        { name: "lead_status", label: "Lead Status", type: "select", required: false }
      ]
    }
  ]);
  const [customFields, setCustomFields] = useState(currentView?.custom_fields || []);
  const [showAddField, setShowAddField] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newField, setNewField] = useState({
    name: "",
    label: "",
    type: "text",
    required: false
  });

  const availableFieldTypes = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "select", label: "Dropdown" },
    { value: "textarea", label: "Text Area" },
    { value: "checkbox", label: "Checkbox" }
  ];

  const handleAddCustomField = () => {
    if (!newField.name || !newField.label) {
      alert("Field name and label are required");
      return;
    }

    const fieldWithId = {
      ...newField,
      name: newField.name.toLowerCase().replace(/\s+/g, '_'),
      id: `custom-${Date.now()}`
    };

    setCustomFields([...customFields, fieldWithId]);
    setNewField({ name: "", label: "", type: "text", required: false });
    setShowAddField(false);
  };

  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      fields: []
    };
    setSections([...sections, newSection]);
    setShowAddSection(false);
  };

  const handleDeleteSection = (sectionId) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handleUpdateSectionTitle = (sectionId, newTitle) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, title: newTitle } : s
    ));
  };

  const handleDeleteField = (sectionId, fieldName) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, fields: s.fields.filter(f => f.name !== fieldName) }
        : s
    ));
  };

  const handleAddFieldToSection = (sectionId, field) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, fields: [...s.fields, field] }
        : s
    ));
  };

  const handleSave = () => {
    const viewConfig = {
      view_name: viewName,
      sections,
      custom_fields: customFields,
      layout_configuration: {
        sections,
        customFields
      },
      field_order: sections.flatMap(s => s.fields.map(f => f.name))
    };

    onSave(viewConfig);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <NeuroInput
          label="View Template Name"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          placeholder="Default View"
        />
        <div className="flex gap-2">
          <NeuroButton onClick={onCancel}>
            Cancel
          </NeuroButton>
          <NeuroButton variant="primary" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </NeuroButton>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, sIdx) => (
          <NeuroCard key={section.id}>
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={section.title}
                onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                className="ampvibe-input font-bold text-lg"
                style={{ color: "#666" }}
              />
              <button
                onClick={() => handleDeleteSection(section.id)}
                className="ampvibe-button p-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {section.fields.map((field) => (
                <div key={field.name} className="ampvibe-inset p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4" style={{ color: "#aaa" }} />
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#666" }}>
                        {field.label}
                      </p>
                      <p className="text-xs" style={{ color: "#aaa" }}>
                        {field.type} {field.required && "• Required"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteField(section.id, field.name)}
                    className="ampvibe-button p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add field to section */}
            <div className="flex gap-2">
              <NeuroButton
                size="sm"
                onClick={() => {
                  const standardField = {
                    name: "address",
                    label: "Address",
                    type: "text",
                    required: false
                  };
                  handleAddFieldToSection(section.id, standardField);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Standard Field
              </NeuroButton>
              {customFields.length > 0 && (
                <NeuroButton
                  size="sm"
                  onClick={() => {
                    if (customFields.length > 0) {
                      handleAddFieldToSection(section.id, customFields[0]);
                    }
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Custom Field
                </NeuroButton>
              )}
            </div>
          </NeuroCard>
        ))}

        <NeuroButton onClick={handleAddSection}>
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </NeuroButton>
      </div>

      {/* Custom Fields Management */}
      <NeuroCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ color: "#666" }}>
            Custom Fields ({customFields.length})
          </h3>
          <NeuroButton size="sm" onClick={() => setShowAddField(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Custom Field
          </NeuroButton>
        </div>

        {customFields.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {customFields.map((field) => (
              <div key={field.id} className="ampvibe-inset p-3 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm" style={{ color: "#666" }}>
                    {field.label}
                  </p>
                  <p className="text-xs" style={{ color: "#aaa" }}>
                    {field.type} • {field.name}
                  </p>
                </div>
                <button
                  onClick={() => setCustomFields(customFields.filter(f => f.id !== field.id))}
                  className="ampvibe-button p-1 text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddField && (
          <div className="ampvibe-inset p-4 rounded-lg space-y-4">
            <NeuroInput
              label="Field Label"
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              placeholder="Customer Lifetime Value"
            />
            <NeuroInput
              label="Field Name (internal)"
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              placeholder="customer_lifetime_value"
            />
            <NeuroSelect
              label="Field Type"
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              options={availableFieldTypes}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="ampvibe-button"
              />
              <label className="text-sm" style={{ color: "#666" }}>Required Field</label>
            </div>
            <div className="flex gap-2 justify-end">
              <NeuroButton size="sm" onClick={() => setShowAddField(false)}>
                Cancel
              </NeuroButton>
              <NeuroButton size="sm" variant="primary" onClick={handleAddCustomField}>
                Add Field
              </NeuroButton>
            </div>
          </div>
        )}
      </NeuroCard>
    </div>
  );
}