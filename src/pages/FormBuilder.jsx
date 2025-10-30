import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Eye, Settings, Wand2, Plus, Search, GripVertical, Trash2, X, ChevronUp, ChevronDown } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function FormBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formId, setFormId] = useState(null);
  const [activeTab, setActiveTab] = useState("form");
  const [searchProperty, setSearchProperty] = useState("");
  
  const [formData, setFormData] = useState({
    form_name: "",
    form_description: "",
    form_type: "Contact Form",
    submit_action: "Create Contact",
    thank_you_message: "Thank you for your submission!",
    redirect_url: "",
    notification_emails: "",
    is_active: true
  });

  const [formFields, setFormFields] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setFormId(id);
    }
  }, []);

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const forms = await base44.entities.Form.filter({ id: formId });
      return forms[0];
    },
    enabled: !!formId
  });

  const { data: fields = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['form-fields', formId],
    queryFn: () => base44.entities.Form_Field.filter({ form_id: formId }, 'field_order'),
    enabled: !!formId
  });

  useEffect(() => {
    if (form) {
      setFormData({
        form_name: form.form_name || "",
        form_description: form.form_description || "",
        form_type: form.form_type || "Contact Form",
        submit_action: form.submit_action || "Create Contact",
        thank_you_message: form.thank_you_message || "Thank you for your submission!",
        redirect_url: form.redirect_url || "",
        notification_emails: form.notification_emails || "",
        is_active: form.is_active ?? true
      });
    }
  }, [form]);

  useEffect(() => {
    if (fields && fields.length > 0) {
      setFormFields(fields.sort((a, b) => (a.field_order || 0) - (b.field_order || 0)));
    }
  }, [fields]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let savedFormId = formId;
      
      if (!savedFormId) {
        const newForm = await base44.entities.Form.create(formData);
        savedFormId = newForm.id;
        setFormId(savedFormId);
      } else {
        await base44.entities.Form.update(savedFormId, formData);
      }

      if (formId) {
        const existingFieldIds = fields.map(f => f.id);
        const currentFieldIds = formFields.map(f => f.id).filter(id => !id.toString().startsWith('temp-'));
        const fieldsToDelete = existingFieldIds.filter(id => !currentFieldIds.includes(id));
        
        for (const fieldId of fieldsToDelete) {
          await base44.entities.Form_Field.delete(fieldId);
        }
      }

      for (let i = 0; i < formFields.length; i++) {
        const field = formFields[i];
        const fieldData = {
          form_id: savedFormId,
          field_label: field.field_label,
          field_name: field.field_name,
          field_type: field.field_type,
          is_required: field.is_required || false,
          placeholder_text: field.placeholder_text || "",
          field_order: i
        };

        if (field.id && !field.id.toString().startsWith('temp-')) {
          await base44.entities.Form_Field.update(field.id, fieldData);
        } else {
          await base44.entities.Form_Field.create(fieldData);
        }
      }

      return savedFormId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forms']);
      queryClient.invalidateQueries(['form', formId]);
      queryClient.invalidateQueries(['form-fields', formId]);
      alert('Form saved successfully!');
    },
    onError: (error) => {
      alert('Failed to save form: ' + error.message);
    }
  });

  const handleSave = async () => {
    await saveMutation.mutateAsync();
  };

  const frequentlyUsedProperties = [
    { name: "first_name", label: "First name", type: "Text", icon: "👤" },
    { name: "last_name", label: "Last name", type: "Text", icon: "👤" },
    { name: "email", label: "Email", type: "Email", icon: "📧" },
    { name: "phone", label: "Phone number", type: "Phone", icon: "📞" },
    { name: "street_address", label: "Street address", type: "Text", icon: "🏠" },
    { name: "city", label: "City", type: "Text", icon: "🌆" },
    { name: "state", label: "State/Region", type: "Text", icon: "📍" },
    { name: "country", label: "Country/Region", type: "Text", icon: "🌍" },
    { name: "mobile", label: "Mobile phone number", type: "Phone", icon: "📱" },
    { name: "company", label: "Company name", type: "Text", icon: "🏢" },
    { name: "job_title", label: "Job title", type: "Text", icon: "💼" },
    { name: "website", label: "Website", type: "Text", icon: "🌐" },
  ];

  const otherFormElements = [
    { name: "message", label: "Message", type: "Textarea", icon: "💬" },
    { name: "dropdown", label: "Dropdown", type: "Dropdown", icon: "📋" },
    { name: "checkbox", label: "Checkbox", type: "Checkbox", icon: "☑️" },
    { name: "radio", label: "Radio", type: "Radio", icon: "🔘" },
    { name: "file", label: "File upload", type: "File Upload", icon: "📎" },
  ];

  const filteredFrequentProperties = frequentlyUsedProperties.filter(prop =>
    prop.label.toLowerCase().includes(searchProperty.toLowerCase())
  );

  const filteredOtherElements = otherFormElements.filter(prop =>
    prop.label.toLowerCase().includes(searchProperty.toLowerCase())
  );

  const addField = (property) => {
    const newField = {
      id: 'temp-' + Date.now(),
      form_id: formId,
      field_label: property.label,
      field_name: property.name,
      field_type: property.type,
      is_required: false,
      placeholder_text: "",
      field_order: formFields.length
    };
    setFormFields([...formFields, newField]);
  };

  const removeField = (fieldId) => {
    setFormFields(formFields.filter(f => f.id !== fieldId));
  };

  const updateField = (fieldId, updates) => {
    setFormFields(formFields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const moveField = (index, direction) => {
    const newFields = [...formFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFields.length) {
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      setFormFields(newFields);
    }
  };

  if (formLoading || (formId && fieldsLoading)) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#f5f7fa' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: "#666" }}>Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f5f7fa' }}>
      <style>{`
        .form-builder-input:focus {
          outline: none;
          border-color: #0066cc;
        }
        .property-button {
          transition: all 0.2s ease;
          border: 1px solid #e5e7eb;
          background: white;
        }
        .property-button:hover {
          background: #f9fafb;
          border-color: #0066cc;
        }
        .field-card {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s ease;
        }
        .field-card:hover {
          border-color: #0066cc;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
        }
        .field-actions {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .field-card:hover .field-actions {
          opacity: 1;
        }
      `}</style>

      {/* Top Bar */}
      <div className="bg-white border-b" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl("Forms"))}
              className="p-2 rounded hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: "#6b7280" }} />
            </button>
            <div>
              <input
                type="text"
                value={formData.form_name}
                onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
                placeholder="Untitled form"
                className="text-xl font-semibold bg-transparent border-none outline-none form-builder-input"
                style={{ color: "#111827", minWidth: "250px" }}
              />
              <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                {formId ? '✓ Auto-saved' : 'Not saved yet'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {formId && (
              <button
                onClick={() => navigate(createPageUrl("FormSubmissions") + `?form=${formId}`)}
                className="px-4 py-2 rounded-md border text-sm font-medium transition-colors"
                style={{ 
                  borderColor: "#e5e7eb",
                  color: "#374151",
                  background: "white"
                }}
              >
                <Eye className="w-4 h-4 inline-block mr-2" />
                View Submissions
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saveMutation.isLoading}
              className="px-6 py-2 rounded-md text-sm font-medium text-white transition-colors"
              style={{ 
                background: saveMutation.isLoading ? "#9ca3af" : "#0066cc",
                cursor: saveMutation.isLoading ? "not-allowed" : "pointer"
              }}
            >
              <Save className="w-4 h-4 inline-block mr-2" />
              {saveMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 px-6" style={{ borderTop: "1px solid #e5e7eb" }}>
          {['form', 'options', 'style', 'automation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab ? '' : ''
              }`}
              style={{
                color: activeTab === tab ? '#0066cc' : '#6b7280',
                borderBottom: activeTab === tab ? '3px solid #0066cc' : '3px solid transparent'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'form' && (
          <>
            {/* Left Sidebar - Properties */}
            <div className="w-80 bg-white border-r overflow-y-auto" style={{ borderColor: "#e5e7eb" }}>
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <button 
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-md"
                    style={{ 
                      background: "#f3f4f6",
                      color: "#111827",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    Existing properties
                  </button>
                  <button 
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-md"
                    style={{ 
                      background: "white",
                      color: "#6b7280",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    Create new
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="Search for properties and fields"
                    value={searchProperty}
                    onChange={(e) => setSearchProperty(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-md border"
                    style={{ 
                      borderColor: "#e5e7eb",
                      color: "#111827"
                    }}
                  />
                </div>

                {/* Frequently Used Properties */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "#9ca3af" }}>
                    Frequently used properties
                  </h3>
                  <div className="space-y-1">
                    {filteredFrequentProperties.map((prop) => (
                      <button
                        key={prop.name}
                        onClick={() => addField(prop)}
                        className="property-button w-full px-3 py-2.5 text-left flex items-center gap-3 text-sm rounded-md"
                      >
                        <span className="text-base">{prop.icon}</span>
                        <span style={{ color: "#374151" }}>{prop.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Other Form Elements */}
                <div>
                  <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "#9ca3af" }}>
                    Other form elements
                  </h3>
                  <div className="space-y-1">
                    {filteredOtherElements.map((prop) => (
                      <button
                        key={prop.name}
                        onClick={() => addField(prop)}
                        className="property-button w-full px-3 py-2.5 text-left flex items-center gap-3 text-sm rounded-md"
                      >
                        <span className="text-base">{prop.icon}</span>
                        <span style={{ color: "#374151" }}>{prop.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Form Preview */}
            <div className="flex-1 overflow-y-auto p-8" style={{ background: '#f5f7fa' }}>
              <div className="max-w-2xl mx-auto">
                {/* Form Preview Card */}
                <div className="bg-white rounded-lg shadow-sm p-8 border" style={{ borderColor: "#e5e7eb" }}>
                  {/* Form Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ background: "#0066cc" }}>
                        A
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: "#111827" }}>AmplifyCRM</p>
                        <p className="text-sm" style={{ color: "#6b7280" }}>Get Started!</p>
                      </div>
                    </div>
                    
                    <div className="border-l-4 pl-4 py-2" style={{ 
                      borderColor: "#06b6d4",
                      background: "#ecfeff"
                    }}>
                      <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>
                        {formData.form_name || "Untitled Form"}
                      </h2>
                    </div>
                  </div>

                  {/* Form Fields */}
                  {formFields.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                      <div className="text-4xl mb-3">📝</div>
                      <p className="text-base font-medium mb-1" style={{ color: "#6b7280" }}>
                        Click on properties to add fields
                      </p>
                      <p className="text-sm" style={{ color: "#9ca3af" }}>
                        Your form is empty. Add fields from the left sidebar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {formFields.map((field, index) => (
                        <div key={field.id} className="field-card p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
                                {field.field_label}
                                {field.is_required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              
                              {field.field_type === 'Textarea' ? (
                                <textarea
                                  className="w-full h-24 px-3 py-2 text-sm rounded-md border"
                                  style={{ borderColor: "#e5e7eb", color: "#6b7280" }}
                                  placeholder={field.placeholder_text || `Enter ${field.field_label.toLowerCase()}`}
                                  disabled
                                />
                              ) : field.field_type === 'Dropdown' ? (
                                <select 
                                  className="w-full px-3 py-2 text-sm rounded-md border"
                                  style={{ borderColor: "#e5e7eb", color: "#6b7280" }}
                                  disabled
                                >
                                  <option>Please Select</option>
                                </select>
                              ) : field.field_type === 'Checkbox' || field.field_type === 'Radio' ? (
                                <div className="flex items-center gap-2">
                                  <input type={field.field_type.toLowerCase()} disabled />
                                  <span className="text-sm" style={{ color: "#6b7280" }}>Option 1</span>
                                </div>
                              ) : (
                                <input
                                  type={field.field_type === 'Email' ? 'email' : field.field_type === 'Phone' ? 'tel' : 'text'}
                                  className="w-full px-3 py-2 text-sm rounded-md border"
                                  style={{ borderColor: "#e5e7eb", color: "#6b7280" }}
                                  placeholder={field.placeholder_text || `Enter ${field.field_label.toLowerCase()}`}
                                  disabled
                                />
                              )}
                            </div>

                            {/* Field Actions */}
                            <div className="field-actions flex flex-col gap-1">
                              <button
                                onClick={() => moveField(index, 'up')}
                                disabled={index === 0}
                                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                style={{ color: index === 0 ? "#d1d5db" : "#6b7280" }}
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveField(index, 'down')}
                                disabled={index === formFields.length - 1}
                                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                style={{ color: index === formFields.length - 1 ? "#d1d5db" : "#6b7280" }}
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateField(field.id, { is_required: !field.is_required })}
                                className={`p-1.5 rounded hover:bg-gray-100 transition-colors font-bold ${
                                  field.is_required ? 'text-red-600' : ''
                                }`}
                                style={{ color: field.is_required ? '#dc2626' : '#6b7280' }}
                                title="Toggle required"
                              >
                                *
                              </button>
                              <button
                                onClick={() => removeField(field.id)}
                                className="p-1.5 rounded hover:bg-red-50 transition-colors"
                                style={{ color: "#dc2626" }}
                                title="Delete field"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button 
                          className="w-full px-6 py-3 rounded-md text-sm font-medium text-white"
                          style={{ background: "#0066cc" }}
                          disabled
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'options' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6 border" style={{ borderColor: "#e5e7eb" }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>Form Options</h2>
                
                <div className="space-y-6">
                  <NeuroSelect
                    label="Form Type"
                    value={formData.form_type}
                    onChange={(e) => setFormData({ ...formData, form_type: e.target.value })}
                    options={[
                      { value: 'Contact Form', label: 'Contact Form' },
                      { value: 'Lead Form', label: 'Lead Form' },
                      { value: 'Ticket Form', label: 'Ticket Form' },
                      { value: 'Newsletter', label: 'Newsletter' },
                      { value: 'Custom', label: 'Custom' }
                    ]}
                  />

                  <NeuroSelect
                    label="Submit Action"
                    value={formData.submit_action}
                    onChange={(e) => setFormData({ ...formData, submit_action: e.target.value })}
                    options={[
                      { value: 'Create Contact', label: 'Create Contact' },
                      { value: 'Create Lead', label: 'Create Lead' },
                      { value: 'Create Ticket', label: 'Create Ticket' },
                      { value: 'Add to List', label: 'Add to List' }
                    ]}
                  />

                  <NeuroInput
                    label="Thank You Message"
                    value={formData.thank_you_message}
                    onChange={(e) => setFormData({ ...formData, thank_you_message: e.target.value })}
                  />

                  <NeuroInput
                    label="Redirect URL (optional)"
                    value={formData.redirect_url}
                    onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                    placeholder="https://example.com/thank-you"
                  />

                  <NeuroInput
                    label="Notification Emails"
                    value={formData.notification_emails}
                    onChange={(e) => setFormData({ ...formData, notification_emails: e.target.value })}
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6 border" style={{ borderColor: "#e5e7eb" }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>Style & Preview</h2>
                <p style={{ color: "#6b7280" }}>Styling options coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6 border" style={{ borderColor: "#e5e7eb" }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>Automation</h2>
                <p style={{ color: "#6b7280" }}>Automation options coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}