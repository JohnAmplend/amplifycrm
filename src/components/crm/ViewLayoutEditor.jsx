
import React, { useState, useRef, useEffect } from "react";
import { Plus, X, GripVertical, Save, Edit2, Trash2, ChevronDown } from "lucide-react";
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
    }
  ]);
  const [customFields, setCustomFields] = useState(currentView?.custom_fields || []);
  const [showAddField, setShowAddField] = useState(false);
  const [showAddStandardField, setShowAddStandardField] = useState(null);
  const [showAddCustomField, setShowAddCustomField] = useState(null);
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
    { value: "select", label: "Single Select" },
    { value: "multi-select", label: "Multiple Select" },
    { value: "textarea", label: "Text Area" },
    { value: "checkbox", label: "Checkbox" }
  ];

  const standardFields = [
    { name: "first_name", label: "First Name", type: "text" },
    { name: "last_name", label: "Last Name", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "mobile", label: "Mobile", type: "text" },
    { name: "job_title", label: "Job Title", type: "text" },
    { name: "department", label: "Department", type: "text" },
    { name: "lifecycle_stage", label: "Lifecycle Stage", type: "select" },
    { name: "lead_status", label: "Lead Status", type: "select" },
    { name: "address", label: "Address", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "state", label: "State", type: "text" },
    { name: "zip", label: "Zip", type: "text" },
    { name: "country", label: "Country", type: "text" },
    { name: "linkedin_url", label: "LinkedIn URL", type: "text" },
    { name: "twitter_handle", label: "Twitter Handle", type: "text" }
  ];

  const handleAddCustomField = () => {
    if (!newField.name || !newField.label) {
      alert("Field name and label are required");
      return;
    }

    const fieldWithId = {
      ...newField,
      name: 'custom_' + newField.name.toLowerCase().replace(/\s+/g, '_'),
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
  };

  const handleDeleteSection = (sectionId) => {
    if (sections.length <= 1) {
      alert("You must have at least one section");
      return;
    }
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
    const fieldExists = sections.some(s => 
      s.fields.some(f => f.name === field.name)
    );
    
    if (fieldExists) {
      alert("This field is already added to a section");
      return;
    }

    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, fields: [...s.fields, field] }
        : s
    ));
    
    setShowAddStandardField(null);
    setShowAddCustomField(null);
  };

  const handleSave = () => {
    if (!viewName) {
      alert("View name is required");
      return;
    }

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
          className="flex-1 max-w-md"
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
        <h3 className="font-bold text-lg" style={{ color: "#666" }}>Sections & Fields</h3>
        
        {sections.map((section) => (
          <NeuroCard key={section.id}>
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={section.title}
                onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                className="ampvibe-input font-bold text-lg flex-1 mr-4"
                style={{ color: "#666" }}
                placeholder="Section Title"
              />
              <button
                onClick={() => handleDeleteSection(section.id)}
                className="ampvibe-button p-2 text-red-600"
                title="Delete Section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Fields in this section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {section.fields.map((field) => (
                <div key={field.name} className="ampvibe-inset p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: "#aaa" }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" style={{ color: "#666" }}>
                        {field.label}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#aaa" }}>
                        {field.type} {field.required && "• Required"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteField(section.id, field.name)}
                    className="ampvibe-button p-1 flex-shrink-0"
                    title="Remove Field"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add field buttons */}
            <div className="flex gap-2 relative">
              <div className="relative">
                <NeuroButton
                  size="sm"
                  onClick={() => setShowAddStandardField(showAddStandardField === section.id ? null : section.id)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Standard Field
                  <ChevronDown className="w-3 h-3 ml-1" />
                </NeuroButton>
                
                {showAddStandardField === section.id && (
                  <div 
                    className="absolute bottom-full left-0 mb-2 p-3 shadow-2xl w-72 max-h-80 overflow-y-auto rounded-xl border"
                    style={{ 
                      zIndex: 99999,
                      background: 'white',
                      borderColor: 'rgba(0, 168, 107, 0.2)',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {standardFields.map((field) => (
                      <button
                        key={field.name}
                        onClick={() => handleAddFieldToSection(section.id, field)}
                        className="w-full text-left px-4 py-3 mb-1 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ 
                          color: '#333',
                          fontWeight: '500'
                        }}
                      >
                        <span style={{ color: '#333', fontSize: '14px' }}>{field.label}</span>
                        <span className="text-xs ml-2" style={{ color: "#888" }}>({field.type})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {customFields.length > 0 && (
                <div className="relative">
                  <NeuroButton
                    size="sm"
                    onClick={() => setShowAddCustomField(showAddCustomField === section.id ? null : section.id)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Custom Field
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </NeuroButton>
                  
                  {showAddCustomField === section.id && (
                    <div 
                      className="absolute bottom-full left-0 mb-2 p-3 shadow-2xl w-72 max-h-80 overflow-y-auto rounded-xl border"
                      style={{ 
                        zIndex: 99999,
                        background: 'white',
                        borderColor: 'rgba(0, 168, 107, 0.2)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      {customFields.map((field) => (
                        <button
                          key={field.id}
                          onClick={() => handleAddFieldToSection(section.id, field)}
                          className="w-full text-left px-4 py-3 mb-1 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                          style={{ 
                            color: '#333',
                            fontWeight: '500'
                          }}
                        >
                          <span style={{ color: '#333', fontSize: '14px' }}>{field.label}</span>
                          <span className="text-xs ml-2" style={{ color: "#888" }}>({field.type})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: "#666" }}>
                    {field.label}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#aaa" }}>
                    {field.type} • {field.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete custom field "${field.label}"?`)) {
                      setCustomFields(customFields.filter(f => f.id !== field.id));
                      setSections(sections.map(s => ({
                        ...s,
                        fields: s.fields.filter(f => f.name !== field.name)
                      })));
                    }
                  }}
                  className="ampvibe-button p-1 text-red-600 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddField && (
          <div className="ampvibe-inset p-4 rounded-lg space-y-4">
            <h4 className="font-bold" style={{ color: "#666" }}>Create New Custom Field</h4>
            <NeuroInput
              label="Field Label (What users see)"
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              placeholder="Customer Lifetime Value"
              required
            />
            <NeuroInput
              label="Field Name (internal identifier, no spaces)"
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              placeholder="customer_lifetime_value"
              required
            />
            <NeuroSelect
              label="Field Type"
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              options={availableFieldTypes}
              required
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
              <NeuroButton size="sm" onClick={() => {
                setShowAddField(false);
                setNewField({ name: "", label: "", type: "text", required: false });
              }}>
                Cancel
              </NeuroButton>
              <NeuroButton size="sm" variant="primary" onClick={handleAddCustomField}>
                <Plus className="w-4 h-4 mr-1" />
                Create Field
              </NeuroButton>
            </div>
          </div>
        )}
      </NeuroCard>
    </div>
  );
}
