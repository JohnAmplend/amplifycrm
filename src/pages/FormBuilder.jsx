
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Eye, Plus, Search, GripVertical, Trash2, X, ChevronUp, ChevronDown, Mail, Users, Bell, Zap, Upload, Palette, Code, Smartphone, Type, Layout, Sparkles, Settings, Wand2 } from "lucide-react";
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
    is_active: true,
    // Automation settings
    automation_enabled: false,
    workflow_actions: [], // These will be handled by a separate state for easier manipulation
    // Style settings
    custom_styles: {
      primary_color: "#0066cc",
      button_color: "#0066cc",
      button_text_color: "#ffffff",
      font_family: "Poppins",
      field_spacing: "normal", // compact, normal, relaxed
      field_padding: "normal", // compact, normal, relaxed
      border_radius: "medium", // none, small, medium, large
      custom_css: "",
      logo_url: "",
      mobile_preset: "responsive" // responsive, compact, large_text
    }
  });

  const [formFields, setFormFields] = useState([]);
  const [workflowActions, setWorkflowActions] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  const { data: contactLists = [] } = useQuery({
    queryKey: ['contact-lists'],
    queryFn: () => base44.entities.Contact_List.list()
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.Email_Template.list()
  });

  const { data: sequences = [] } = useQuery({
    queryKey: ['email-sequences'],
    queryFn: () => base44.entities.Email_Sequence.list()
  });

  useEffect(() => {
    if (form) {
      const customData = form.custom_data || {};
      setFormData({
        form_name: form.form_name || "",
        form_description: form.form_description || "",
        form_type: form.form_type || "Contact Form",
        submit_action: form.submit_action || "Create Contact",
        thank_you_message: form.thank_you_message || "Thank you for your submission!",
        redirect_url: form.redirect_url || "",
        notification_emails: form.notification_emails || "",
        is_active: form.is_active ?? true,
        automation_enabled: customData.automation_enabled || false,
        workflow_actions: [], // workflowActions are managed by its own state
        custom_styles: customData.custom_styles || {
          primary_color: "#0066cc",
          button_color: "#0066cc",
          button_text_color: "#ffffff",
          font_family: "Poppins",
          field_spacing: "normal",
          field_padding: "normal",
          border_radius: "medium",
          custom_css: "",
          logo_url: "",
          mobile_preset: "responsive"
        }
      });
      setWorkflowActions(customData.workflow_actions || []);
    }
  }, [form]);

  useEffect(() => {
    if (fields && fields.length > 0) {
      setFormFields(fields.sort((a, b) => (a.field_order || 0) - (b.field_order || 0)));
    }
  }, [fields]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        custom_styles: {
          ...formData.custom_styles,
          logo_url: file_url
        }
      });
      setLogoFile(null); // Clear file input
    } catch (error) {
      alert('Failed to upload logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let savedFormId = formId;
      
      const dataToSave = {
        ...formData,
        // custom_data will contain all additional dynamic settings
        custom_data: {
          automation_enabled: formData.automation_enabled,
          workflow_actions: workflowActions, // Save the separate workflowActions state
          custom_styles: formData.custom_styles
        }
      };

      // Remove workflow_actions from top-level formData before saving, as it's now in custom_data
      delete dataToSave.workflow_actions;

      if (!savedFormId) {
        const newForm = await base44.entities.Form.create(dataToSave);
        savedFormId = newForm.id;
        setFormId(savedFormId);
        navigate(createPageUrl("FormBuilder") + `?id=${savedFormId}`, { replace: true });
      } else {
        await base44.entities.Form.update(savedFormId, dataToSave);
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

  // Workflow action handlers
  const addWorkflowAction = (type) => {
    const newAction = {
      id: 'temp-' + Date.now(), // Use temp ID for new actions
      type,
      order: workflowActions.length,
      enabled: true,
      config: getDefaultConfig(type)
    };
    setWorkflowActions([...workflowActions, newAction]);
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'send_email':
        return { template_id: '', delay_minutes: 0, recipient_email: '', subject: '', body: '' };
      case 'add_to_list':
        return { list_id: '' };
      case 'notify_team':
        return { emails: '', message: '' };
      case 'create_task':
        return { task_name: '', assigned_to: '', priority: 'Medium' };
      case 'add_to_sequence':
        return { sequence_id: '' };
      case 'conditional':
        return { field: '', operator: 'equals', value: '', then_actions: [] };
      default:
        return {};
    }
  };

  const updateWorkflowAction = (id, updates) => {
    setWorkflowActions(workflowActions.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeWorkflowAction = (id) => {
    setWorkflowActions(workflowActions.filter(a => a.id !== id));
  };

  const moveWorkflowAction = (index, direction) => {
    const newActions = [...workflowActions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newActions.length) {
      [newActions[index], newActions[newIndex]] = [newActions[newIndex], newActions[index]];
      newActions.forEach((action, idx) => action.order = idx); // Re-order
      setWorkflowActions(newActions);
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'send_email': return <Mail className="w-4 h-4" />;
      case 'add_to_list': return <Users className="w-4 h-4" />;
      case 'notify_team': return <Bell className="w-4 h-4" />;
      case 'create_task': return <Plus className="w-4 h-4" />;
      case 'add_to_sequence': return <Zap className="w-4 h-4" />;
      case 'conditional': return <Wand2 className="w-4 h-4" />;
      default: return null;
    }
  };

  const getActionLabel = (type) => {
    switch (type) {
      case 'send_email': return 'Send Email';
      case 'add_to_list': return 'Add to Contact List';
      case 'notify_team': return 'Notify Team';
      case 'create_task': return 'Create Task';
      case 'add_to_sequence': return 'Add to Sequence';
      case 'conditional': return 'Conditional Logic';
      default: return 'Unknown Action';
    }
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

  // Get dynamic styles for preview
  const getPreviewStyles = () => {
    const styles = formData.custom_styles;
    const spacing = {
      compact: '12px',
      normal: '20px',
      relaxed: '32px'
    };
    const padding = {
      compact: '8px 12px',
      normal: '12px 16px',
      relaxed: '16px 24px'
    };
    const radius = {
      none: '0',
      small: '4px',
      medium: '8px',
      large: '12px'
    };

    return {
      fontFamily: styles.font_family,
      buttonColor: styles.button_color,
      buttonTextColor: styles.button_text_color,
      primaryColor: styles.primary_color,
      fieldSpacing: spacing[styles.field_spacing] || spacing.normal,
      fieldPadding: padding[styles.field_padding] || padding.normal,
      borderRadius: radius[styles.border_radius] || radius.medium,
      mobilePreset: styles.mobile_preset
    };
  };

  const previewStyles = getPreviewStyles();

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
        .workflow-action-card {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s ease;
        }
        .workflow-action-card:hover {
          border-color: #0066cc;
        }
        .color-input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border: none;
          cursor: pointer;
          padding: 0;
          background: transparent;
        }
        .color-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-input::-webkit-color-swatch {
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        .color-input::-moz-color-swatch-wrapper {
          padding: 0;
        }
        .color-input::-moz-color-swatch {
          border-radius: 4px;
          border: 1px solid #e5e7eb;
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
              className={`px-1 py-3 text-sm font-medium transition-colors relative`}
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
                  <button className="flex-1 px-3 py-2 text-xs font-medium rounded-md" style={{ background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb" }}>
                    Existing properties
                  </button>
                  <button className="flex-1 px-3 py-2 text-xs font-medium rounded-md" style={{ background: "white", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                    Create new
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "#9ca3af" }} />
                  <input
                    type="text"
                    placeholder="Search for properties and fields"
                    value={searchProperty}
                    onChange={(e) => setSearchProperty(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-md border"
                    style={{ borderColor: "#e5e7eb", color: "#111827" }}
                  />
                </div>

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
                <div className="bg-white rounded-lg shadow-sm p-8 border" style={{ borderColor: "#e5e7eb", fontFamily: previewStyles.fontFamily }}>
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      {formData.custom_styles.logo_url ? (
                        <img src={formData.custom_styles.logo_url} alt="Logo" className="h-12 w-12 object-contain rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ background: previewStyles.primaryColor }}>
                          A
                        </div>
                      )}
                      <div>
                        <p className="font-semibold" style={{ color: "#111827" }}>AmplifyCRM</p>
                        <p className="text-sm" style={{ color: "#6b7280" }}>Get Started!</p>
                      </div>
                    </div>
                    
                    <div className="border-l-4 pl-4 py-2" style={{ borderColor: previewStyles.primaryColor, background: `${previewStyles.primaryColor}11` }}>
                      <h2 className="text-2xl font-bold" style={{ color: "#111827" }}>
                        {formData.form_name || "Untitled Form"}
                      </h2>
                    </div>
                  </div>

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: previewStyles.fieldSpacing }}>
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
                                  className="w-full h-24 text-sm"
                                  style={{ 
                                    borderColor: "#e5e7eb", 
                                    color: "#6b7280", 
                                    padding: previewStyles.fieldPadding,
                                    borderRadius: previewStyles.borderRadius,
                                    border: '1px solid #e5e7eb'
                                  }}
                                  placeholder={field.placeholder_text || `Enter ${field.field_label.toLowerCase()}`}
                                  disabled
                                />
                              ) : field.field_type === 'Dropdown' ? (
                                <select 
                                  className="w-full text-sm"
                                  style={{ 
                                    borderColor: "#e5e7eb", 
                                    color: "#6b7280",
                                    padding: previewStyles.fieldPadding,
                                    borderRadius: previewStyles.borderRadius,
                                    border: '1px solid #e5e7eb'
                                  }}
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
                                  className="w-full text-sm"
                                  style={{ 
                                    borderColor: "#e5e7eb", 
                                    color: "#6b7280",
                                    padding: previewStyles.fieldPadding,
                                    borderRadius: previewStyles.borderRadius,
                                    border: '1px solid #e5e7eb'
                                  }}
                                  placeholder={field.placeholder_text || `Enter ${field.field_label.toLowerCase()}`}
                                  disabled
                                />
                              )}
                            </div>

                            <div className="field-actions flex flex-col gap-1">
                              <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="p-1.5 rounded hover:bg-gray-100 transition-colors" style={{ color: index === 0 ? "#d1d5db" : "#6b7280" }} title="Move up">
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => moveField(index, 'down')} disabled={index === formFields.length - 1} className="p-1.5 rounded hover:bg-gray-100 transition-colors" style={{ color: index === formFields.length - 1 ? "#d1d5db" : "#6b7280" }} title="Move down">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button onClick={() => updateField(field.id, { is_required: !field.is_required })} className={`p-1.5 rounded hover:bg-gray-100 transition-colors font-bold`} style={{ color: field.is_required ? '#dc2626' : '#6b7280' }} title="Toggle required">
                                *
                              </button>
                              <button onClick={() => removeField(field.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors" style={{ color: "#dc2626" }} title="Delete field">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-2">
                        <button 
                          className="w-full px-6 py-3 text-sm font-medium"
                          style={{ 
                            background: previewStyles.buttonColor,
                            color: previewStyles.buttonTextColor,
                            borderRadius: previewStyles.borderRadius
                          }}
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
                <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>Style & Appearance</h2>
                
                <div className="space-y-6">
                  {/* Colors */}
                  <div className="border-b pb-4" style={{borderColor: "#e5e7eb"}}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
                      <Palette className="w-5 h-5" /> Colors
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium w-32" style={{ color: "#374151" }}>Primary Color</label>
                        <input
                          type="color"
                          className="color-input"
                          value={formData.custom_styles.primary_color}
                          onChange={(e) => setFormData({
                            ...formData,
                            custom_styles: { ...formData.custom_styles, primary_color: e.target.value }
                          })}
                        />
                        <NeuroInput
                          type="text"
                          value={formData.custom_styles.primary_color}
                          onChange={(e) => setFormData({
                            ...formData,
                            custom_styles: { ...formData.custom_styles, primary_color: e.target.value }
                          })}
                          className="!py-1 !px-2 text-sm max-w-[100px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium w-32" style={{ color: "#374151" }}>Button Color</label>
                        <input
                          type="color"
                          className="color-input"
                          value={formData.custom_styles.button_color}
                          onChange={(e) => setFormData({
                            ...formData,
                            custom_styles: { ...formData.custom_styles, button_color: e.target.value }
                          })}
                        />
                        <NeuroInput
                          type="text"
                          value={formData.custom_styles.button_color}
                          onChange={(e) => setFormData({
                            ...formData,
                            custom_styles: { ...formData.custom_styles, button_color: e.target.value }
                          })}
                          className="!py-1 !px-2 text-sm max-w-[100px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium w-32" style={{ color: "#374151" }}>Button Text Color</label>
                        <input
                          type="color"
                          className="color-input"
                          value={formData.custom_styles.button_text_color}
                          onChange={(e) => setFormData({
                            ...formData,
                            custom_styles: { ...formData.custom_styles, button_text_color: e.target.value }
                          })}
                        />
                        <NeuroInput
                          type="text"
                          value={formData.custom_styles.button_text_color}
                          onChange={(e) => setFormData({
                            ...formData,
                            custom_styles: { ...formData.custom_styles, button_text_color: e.target.value }
                          })}
                          className="!py-1 !px-2 text-sm max-w-[100px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="border-b pb-4" style={{borderColor: "#e5e7eb"}}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
                      <Type className="w-5 h-5" /> Typography
                    </h3>
                    <NeuroSelect
                      label="Font Family"
                      value={formData.custom_styles.font_family}
                      onChange={(e) => setFormData({
                        ...formData,
                        custom_styles: { ...formData.custom_styles, font_family: e.target.value }
                      })}
                      options={[
                        { value: 'Poppins, sans-serif', label: 'Poppins' },
                        { value: 'Inter, sans-serif', label: 'Inter' },
                        { value: 'Open Sans, sans-serif', label: 'Open Sans' },
                        { value: 'Roboto, sans-serif', label: 'Roboto' },
                        { value: 'Arial, sans-serif', label: 'Arial' },
                        { value: 'Georgia, serif', label: 'Georgia' },
                      ]}
                    />
                  </div>

                  {/* Layout */}
                  <div className="border-b pb-4" style={{borderColor: "#e5e7eb"}}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
                      <Layout className="w-5 h-5" /> Layout
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <NeuroSelect
                        label="Field Spacing"
                        value={formData.custom_styles.field_spacing}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_styles: { ...formData.custom_styles, field_spacing: e.target.value }
                        })}
                        options={[
                          { value: 'compact', label: 'Compact' },
                          { value: 'normal', label: 'Normal' },
                          { value: 'relaxed', label: 'Relaxed' },
                        ]}
                      />
                      <NeuroSelect
                        label="Field Padding"
                        value={formData.custom_styles.field_padding}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_styles: { ...formData.custom_styles, field_padding: e.target.value }
                        })}
                        options={[
                          { value: 'compact', label: 'Compact' },
                          { value: 'normal', label: 'Normal' },
                          { value: 'relaxed', label: 'Relaxed' },
                        ]}
                      />
                      <NeuroSelect
                        label="Border Radius"
                        value={formData.custom_styles.border_radius}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_styles: { ...formData.custom_styles, border_radius: e.target.value }
                        })}
                        options={[
                          { value: 'none', label: 'None (0px)' },
                          { value: 'small', label: 'Small (4px)' },
                          { value: 'medium', label: 'Medium (8px)' },
                          { value: 'large', label: 'Large (12px)' },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Branding */}
                  <div className="border-b pb-4" style={{borderColor: "#e5e7eb"}}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
                      <Sparkles className="w-5 h-5" /> Branding
                    </h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      <div className="flex items-center gap-4">
                        {formData.custom_styles.logo_url && (
                          <div className="relative w-24 h-24 rounded-lg border flex items-center justify-center bg-gray-50">
                            <img src={formData.custom_styles.logo_url} alt="Current Logo" className="max-w-full max-h-full object-contain" />
                            <button
                              onClick={() => setFormData({ ...formData, custom_styles: { ...formData.custom_styles, logo_url: '' } })}
                              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                              title="Remove logo"
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        )}
                        <label
                          htmlFor="logo-upload"
                          className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                            uploadingLogo ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-50 cursor-pointer'
                          }`}
                          style={{ borderColor: "#e5e7eb", color: "#374151" }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </label>
                      </div>
                    </div>
                    <NeuroSelect
                        label="Mobile Layout"
                        value={formData.custom_styles.mobile_preset}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_styles: { ...formData.custom_styles, mobile_preset: e.target.value }
                        })}
                        options={[
                          { value: 'responsive', label: 'Responsive (Default)' },
                          { value: 'compact', label: 'Compact Layout' },
                          { value: 'large_text', label: 'Large Text Fields' },
                        ]}
                      />
                  </div>


                  {/* Advanced */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#111827" }}>
                      <Code className="w-5 h-5" /> Advanced
                    </h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>Custom CSS</label>
                      <textarea
                        className="w-full p-3 border rounded-md font-mono text-sm"
                        rows="6"
                        value={formData.custom_styles.custom_css}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_styles: { ...formData.custom_styles, custom_css: e.target.value }
                        })}
                        placeholder="/* Add your custom CSS here */"
                        style={{ borderColor: "#e5e7eb", color: "#374151", background: "#f9fafb" }}
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">Use with caution. Incorrect CSS may break your form layout.</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6 border" style={{ borderColor: "#e5e7eb" }}>
                <h2 className="text-xl font-bold mb-6" style={{ color: "#111827" }}>Automation Workflow</h2>
                
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label htmlFor="automation-toggle" className="text-sm font-medium cursor-pointer" style={{ color: "#374151" }}>Enable Automation</label>
                    <input
                      type="checkbox"
                      id="automation-toggle"
                      checked={formData.automation_enabled}
                      onChange={(e) => setFormData({ ...formData, automation_enabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <NeuroButton
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => document.getElementById('add-action-dropdown').classList.toggle('hidden')}
                      variant="primary"
                    >
                      Add Action
                    </NeuroButton>
                    <div id="add-action-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
                      <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { addWorkflowAction('send_email'); document.getElementById('add-action-dropdown').classList.add('hidden'); }}>
                        <Mail className="w-4 h-4" /> Send Email
                      </button>
                      <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { addWorkflowAction('add_to_list'); document.getElementById('add-action-dropdown').classList.add('hidden'); }}>
                        <Users className="w-4 h-4" /> Add to List
                      </button>
                      <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { addWorkflowAction('notify_team'); document.getElementById('add-action-dropdown').classList.add('hidden'); }}>
                        <Bell className="w-4 h-4" /> Notify Team
                      </button>
                      <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { addWorkflowAction('create_task'); document.getElementById('add-action-dropdown').classList.add('hidden'); }}>
                        <Plus className="w-4 h-4" /> Create Task
                      </button>
                      <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { addWorkflowAction('add_to_sequence'); document.getElementById('add-action-dropdown').classList.add('hidden'); }}>
                        <Zap className="w-4 h-4" /> Add to Sequence
                      </button>
                      <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { addWorkflowAction('conditional'); document.getElementById('add-action-dropdown').classList.add('hidden'); }}>
                        <Wand2 className="w-4 h-4" /> Conditional Logic
                      </button>
                    </div>
                  </div>
                </div>

                {!formData.automation_enabled && (
                  <div className="text-center py-12 text-gray-500">
                    Automation is currently disabled. Enable it to add workflow actions.
                  </div>
                )}

                {formData.automation_enabled && workflowActions.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: "#e5e7eb" }}>
                    <div className="text-4xl mb-3">⚙️</div>
                    <p className="text-base font-medium mb-1" style={{ color: "#6b7280" }}>
                      No automation actions configured.
                    </p>
                    <p className="text-sm" style={{ color: "#9ca3af" }}>
                      Click "Add Action" to set up what happens after a submission.
                    </p>
                  </div>
                )}

                {formData.automation_enabled && workflowActions.length > 0 && (
                  <div className="space-y-4">
                    {workflowActions.map((action, index) => (
                      <div key={action.id} className="workflow-action-card p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {getActionIcon(action.type)}
                            <h3 className="font-semibold text-base" style={{ color: "#111827" }}>
                              {getActionLabel(action.type)}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={action.enabled}
                              onChange={(e) => updateWorkflowAction(action.id, { enabled: e.target.checked })}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm" style={{ color: "#374151" }}>Enabled</label>

                            <button onClick={() => moveWorkflowAction(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-gray-100" title="Move Up">
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => moveWorkflowAction(index, 'down')} disabled={index === workflowActions.length - 1} className="p-1 rounded hover:bg-gray-100" title="Move Down">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button onClick={() => removeWorkflowAction(action.id)} className="p-1 rounded hover:bg-red-50" title="Remove Action">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>

                        {action.enabled && (
                          <div className="space-y-3">
                            {action.type === 'send_email' && (
                              <>
                                <NeuroSelect
                                  label="Email Template"
                                  value={action.config.template_id}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, template_id: e.target.value } })}
                                  options={[{ value: '', label: 'Select template' }, ...emailTemplates.map(t => ({ value: t.id, label: t.template_name }))]}
                                />
                                <NeuroInput
                                  label="Recipient Email (comma separated)"
                                  value={action.config.recipient_email}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, recipient_email: e.target.value } })}
                                  placeholder="user@example.com"
                                />
                                <NeuroInput
                                  label="Subject (optional, overrides template)"
                                  value={action.config.subject}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, subject: e.target.value } })}
                                />
                                <NeuroInput
                                  label="Body (optional, overrides template)"
                                  type="textarea"
                                  value={action.config.body}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, body: e.target.value } })}
                                />
                                <NeuroInput
                                  label="Delay (minutes)"
                                  type="number"
                                  value={action.config.delay_minutes}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, delay_minutes: parseInt(e.target.value) || 0 } })}
                                />
                              </>
                            )}

                            {action.type === 'add_to_list' && (
                              <NeuroSelect
                                label="Contact List"
                                value={action.config.list_id}
                                onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, list_id: e.target.value } })}
                                options={[{ value: '', label: 'Select list' }, ...contactLists.map(list => ({ value: list.id, label: list.list_name }))]}
                              />
                            )}

                            {action.type === 'notify_team' && (
                              <>
                                <NeuroInput
                                  label="Notification Emails (comma separated)"
                                  value={action.config.emails}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, emails: e.target.value } })}
                                  placeholder="team@example.com"
                                />
                                <NeuroInput
                                  label="Message"
                                  type="textarea"
                                  value={action.config.message}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, message: e.target.value } })}
                                  placeholder="New form submission from {form.form_name}"
                                />
                              </>
                            )}

                            {action.type === 'create_task' && (
                              <>
                                <NeuroInput
                                  label="Task Name"
                                  value={action.config.task_name}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, task_name: e.target.value } })}
                                />
                                <NeuroInput
                                  label="Assigned To (User ID or Email)"
                                  value={action.config.assigned_to}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, assigned_to: e.target.value } })}
                                />
                                <NeuroSelect
                                  label="Priority"
                                  value={action.config.priority}
                                  onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, priority: e.target.value } })}
                                  options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }]}
                                />
                              </>
                            )}

                            {action.type === 'add_to_sequence' && (
                              <NeuroSelect
                                label="Email Sequence"
                                value={action.config.sequence_id}
                                onChange={(e) => updateWorkflowAction(action.id, { config: { ...action.config, sequence_id: e.target.value } })}
                                options={[{ value: '', label: 'Select sequence' }, ...sequences.map(s => ({ value: s.id, label: s.sequence_name }))]}
                              />
                            )}

                            {/* Conditional Logic (simplified for now) */}
                            {action.type === 'conditional' && (
                              <p className="text-sm text-gray-500">Conditional logic configuration coming soon.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
