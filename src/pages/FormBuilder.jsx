import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Eye, Settings, Wand2, Plus, Search, GripVertical, Trash2, X } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function FormBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formId, setFormId] = useState(null);
  const [activeTab, setActiveTab] = useState("form"); // form, options, style, automation
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

  const { data: form } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const forms = await base44.entities.Form.filter({ id: formId });
      return forms[0];
    },
    enabled: !!formId,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          form_name: data.form_name || "",
          form_description: data.form_description || "",
          form_type: data.form_type || "Contact Form",
          submit_action: data.submit_action || "Create Contact",
          thank_you_message: data.thank_you_message || "",
          redirect_url: data.redirect_url || "",
          notification_emails: data.notification_emails || "",
          is_active: data.is_active ?? true
        });
      }
    }
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['form-fields', formId],
    queryFn: () => base44.entities.Form_Field.filter({ form_id: formId }),
    enabled: !!formId,
    onSuccess: (data) => {
      setFormFields(data.sort((a, b) => (a.field_order || 0) - (b.field_order || 0)));
    }
  });

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

      // Save fields
      for (let i = 0; i < formFields.length; i++) {
        const field = formFields[i];
        const fieldData = {
          ...field,
          form_id: savedFormId,
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
    }
  });

  const handleSave = async () => {
    await saveMutation.mutateAsync();
    alert('Form saved successfully!');
  };

  // Predefined properties (HubSpot style)
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

  return (
    <div className="h-screen flex flex-col" style={{ background: '#f5f8fa' }}>
      {/* Top Bar */}
      <div className="ampvibe-card border-b" style={{ borderColor: "#e0e0e0" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl("Forms"))}
              className="ampvibe-button p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <input
                type="text"
                value={formData.form_name}
                onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
                placeholder="Untitled form"
                className="text-xl font-bold bg-transparent border-none outline-none"
                style={{ color: "#333" }}
              />
              <p className="text-sm" style={{ color: "#888" }}>
                {formId ? '✓ Auto-saved' : 'Not saved yet'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <NeuroButton onClick={() => navigate(createPageUrl("FormSubmissions") + `?form=${formId}`)}>
              <Eye className="w-4 h-4 mr-2" />
              View Submissions
            </NeuroButton>
            <NeuroButton variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </NeuroButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-t" style={{ borderColor: "#e0e0e0" }}>
          {['form', 'options', 'style', 'automation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
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
            <div className="w-80 bg-white border-r overflow-y-auto" style={{ borderColor: "#e0e0e0" }}>
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  <button className="flex-1 ampvibe-button px-3 py-2 text-sm active">
                    Existing properties
                  </button>
                  <button className="flex-1 ampvibe-button px-3 py-2 text-sm">
                    Create new
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "#aaa" }} />
                  <input
                    type="text"
                    placeholder="Search for properties and fields"
                    value={searchProperty}
                    onChange={(e) => setSearchProperty(e.target.value)}
                    className="ampvibe-input w-full pl-10 text-sm"
                  />
                </div>

                {/* Frequently Used Properties */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#666" }}>
                    Frequently used properties
                  </h3>
                  <div className="space-y-1">
                    {filteredFrequentProperties.map((prop) => (
                      <button
                        key={prop.name}
                        onClick={() => addField(prop)}
                        className="w-full ampvibe-button px-3 py-2 text-left flex items-center gap-3 text-sm hover:bg-blue-50"
                      >
                        <span className="text-lg">{prop.icon}</span>
                        <span style={{ color: "#666" }}>{prop.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Other Form Elements */}
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#666" }}>
                    Other form elements
                  </h3>
                  <div className="space-y-1">
                    {filteredOtherElements.map((prop) => (
                      <button
                        key={prop.name}
                        onClick={() => addField(prop)}
                        className="w-full ampvibe-button px-3 py-2 text-left flex items-center gap-3 text-sm hover:bg-blue-50"
                      >
                        <span className="text-lg">{prop.icon}</span>
                        <span style={{ color: "#666" }}>{prop.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Form Preview */}
            <div className="flex-1 overflow-y-auto p-8" style={{ background: '#f5f8fa' }}>
              <div className="max-w-2xl mx-auto">
                {/* Form Preview Card */}
                <div className="ampvibe-card p-8">
                  {/* Form Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        A
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: "#333" }}>AmplifyCRM</p>
                        <p className="text-sm" style={{ color: "#888" }}>Get Started!</p>
                      </div>
                    </div>
                    
                    <div className="border-l-4 border-cyan-500 pl-4 py-2 bg-cyan-50">
                      <h2 className="text-2xl font-bold" style={{ color: "#333" }}>
                        {formData.form_name || "Untitled Form"}
                      </h2>
                    </div>
                  </div>

                  {/* Form Fields */}
                  {formFields.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: "#ddd" }}>
                      <p className="text-lg mb-2" style={{ color: "#888" }}>
                        Click on properties to add fields
                      </p>
                      <p className="text-sm" style={{ color: "#aaa" }}>
                        Your form is empty. Add fields from the left sidebar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formFields.map((field, index) => (
                        <div key={field.id} className="group">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <label className="block text-sm font-medium mb-2" style={{ color: "#333" }}>
                                {field.field_label}
                                {field.is_required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              
                              {field.field_type === 'Textarea' ? (
                                <textarea
                                  className="ampvibe-input w-full h-24"
                                  placeholder={field.placeholder_text || `Enter ${field.field_label.toLowerCase()}`}
                                  disabled
                                />
                              ) : field.field_type === 'Dropdown' ? (
                                <select className="ampvibe-input w-full" disabled>
                                  <option>Please Select</option>
                                </select>
                              ) : field.field_type === 'Checkbox' || field.field_type === 'Radio' ? (
                                <div className="flex items-center gap-2">
                                  <input type={field.field_type.toLowerCase()} disabled />
                                  <span className="text-sm" style={{ color: "#666" }}>Option 1</span>
                                </div>
                              ) : (
                                <input
                                  type={field.field_type === 'Email' ? 'email' : field.field_type === 'Phone' ? 'tel' : 'text'}
                                  className="ampvibe-input w-full"
                                  placeholder={field.placeholder_text || `Enter ${field.field_label.toLowerCase()}`}
                                  disabled
                                />
                              )}
                            </div>

                            {/* Field Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => moveField(index, 'up')}
                                disabled={index === 0}
                                className="ampvibe-button p-2"
                              >
                                <GripVertical className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const required = !field.is_required;
                                  updateField(field.id, { is_required: required });
                                }}
                                className={`ampvibe-button p-2 ${field.is_required ? 'text-red-600' : ''}`}
                                title="Toggle required"
                              >
                                *
                              </button>
                              <button
                                onClick={() => removeField(field.id)}
                                className="ampvibe-button p-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Submit Button */}
                      <div className="pt-4">
                        <button className="ampvibe-button-primary px-6 py-3 w-full" disabled>
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
              <NeuroCard className="p-6">
                <h2 className="text-xl font-bold mb-6" style={{ color: "#666" }}>Form Options</h2>
                
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
              </NeuroCard>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <NeuroCard className="p-6">
                <h2 className="text-xl font-bold mb-6" style={{ color: "#666" }}>Style & Preview</h2>
                <p style={{ color: "#888" }}>Styling options coming soon...</p>
              </NeuroCard>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <NeuroCard className="p-6">
                <h2 className="text-xl font-bold mb-6" style={{ color: "#666" }}>Automation</h2>
                <p style={{ color: "#888" }}>Automation options coming soon...</p>
              </NeuroCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}