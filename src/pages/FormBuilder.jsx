import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function FormBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formId, setFormId] = useState(null);
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
  const [fields, setFields] = useState([
    { field_label: "Name", field_name: "name", field_type: "Text", is_required: true, field_order: 1 },
    { field_label: "Email", field_name: "email", field_type: "Email", is_required: true, field_order: 2 }
  ]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setFormId(id);
  }, []);

  const { data: form } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => base44.entities.Form.filter({ id: formId }),
    enabled: !!formId,
    select: (data) => data[0],
    onSuccess: (data) => {
      if (data) {
        setFormData({
          form_name: data.form_name,
          form_description: data.form_description || "",
          form_type: data.form_type,
          submit_action: data.submit_action,
          thank_you_message: data.thank_you_message || "Thank you for your submission!",
          redirect_url: data.redirect_url || "",
          notification_emails: data.notification_emails || "",
          is_active: data.is_active !== false
        });
      }
    }
  });

  const { data: formFields = [] } = useQuery({
    queryKey: ['form_fields', formId],
    queryFn: () => base44.entities.Form_Field.filter({ form_id: formId }, 'field_order'),
    enabled: !!formId,
    onSuccess: (data) => {
      if (data.length > 0) {
        setFields(data);
      }
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let savedForm;
      if (formId) {
        savedForm = await base44.entities.Form.update(formId, data.formData);
      } else {
        savedForm = await base44.entities.Form.create(data.formData);
      }

      // Save fields
      if (!formId) {
        // Create new fields
        for (const field of data.fields) {
          await base44.entities.Form_Field.create({
            ...field,
            form_id: savedForm.id
          });
        }
      }

      return savedForm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forms']);
      navigate(createPageUrl("Forms"));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ formData, fields });
  };

  const addField = () => {
    setFields([...fields, {
      field_label: "New Field",
      field_name: `field_${fields.length + 1}`,
      field_type: "Text",
      is_required: false,
      field_order: fields.length + 1
    }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, updates) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("Forms"))}>
            <ArrowLeft className="w-4 h-4" />
          </NeuroButton>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
              {formId ? 'Edit Form' : 'Create Form'}
            </h1>
            <p style={{ color: "#888" }}>Build your web form</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Form Settings */}
              <NeuroCard>
                <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                  Form Settings
                </h2>
                <div className="space-y-4">
                  <NeuroInput
                    label="Form Name"
                    value={formData.form_name}
                    onChange={(e) => setFormData({ ...formData, form_name: e.target.value })}
                    required
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: "#333" }}>
                      Description
                    </label>
                    <textarea
                      value={formData.form_description}
                      onChange={(e) => setFormData({ ...formData, form_description: e.target.value })}
                      className="ampvibe-input w-full min-h-[100px]"
                      placeholder="Describe what this form is for..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      required
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
                      required
                    />
                  </div>
                  <NeuroInput
                    label="Thank You Message"
                    value={formData.thank_you_message}
                    onChange={(e) => setFormData({ ...formData, thank_you_message: e.target.value })}
                  />
                  <NeuroInput
                    label="Notification Emails"
                    value={formData.notification_emails}
                    onChange={(e) => setFormData({ ...formData, notification_emails: e.target.value })}
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
              </NeuroCard>

              {/* Form Fields */}
              <NeuroCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold" style={{ color: "#666" }}>
                    Form Fields
                  </h2>
                  <NeuroButton type="button" size="sm" onClick={addField}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Field
                  </NeuroButton>
                </div>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={index} className="ampvibe-inset p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="ampvibe-button p-2 cursor-move">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={field.field_label}
                            onChange={(e) => updateField(index, { field_label: e.target.value })}
                            className="ampvibe-input"
                            placeholder="Field Label"
                          />
                          <select
                            value={field.field_type}
                            onChange={(e) => updateField(index, { field_type: e.target.value })}
                            className="ampvibe-input"
                          >
                            <option value="Text">Text</option>
                            <option value="Email">Email</option>
                            <option value="Phone">Phone</option>
                            <option value="Textarea">Textarea</option>
                            <option value="Dropdown">Dropdown</option>
                            <option value="Checkbox">Checkbox</option>
                          </select>
                          <label className="flex items-center gap-2 col-span-2">
                            <input
                              type="checkbox"
                              checked={field.is_required}
                              onChange={(e) => updateField(index, { is_required: e.target.checked })}
                              className="ampvibe-button w-5 h-5"
                            />
                            <span style={{ color: "#666" }}>Required</span>
                          </label>
                        </div>
                        <NeuroButton type="button" size="sm" onClick={() => removeField(index)}>
                          <Trash2 className="w-4 h-4" />
                        </NeuroButton>
                      </div>
                    </div>
                  ))}
                </div>
              </NeuroCard>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <NeuroCard>
                <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                  Preview
                </h3>
                <div className="ampvibe-inset p-4 rounded-lg space-y-3">
                  {fields.map((field, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium mb-1" style={{ color: "#666" }}>
                        {field.field_label} {field.is_required && <span style={{ color: "#f5222d" }}>*</span>}
                      </label>
                      {field.field_type === 'Textarea' ? (
                        <textarea className="ampvibe-input w-full" rows="3" disabled />
                      ) : (
                        <input
                          type={field.field_type === 'Email' ? 'email' : field.field_type === 'Phone' ? 'tel' : 'text'}
                          className="ampvibe-input w-full"
                          disabled
                        />
                      )}
                    </div>
                  ))}
                  <button type="button" className="ampvibe-button-primary px-6 py-3 w-full" disabled>
                    Submit
                  </button>
                </div>
              </NeuroCard>

              <NeuroButton type="submit" variant="primary" className="w-full" disabled={saveMutation.isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isLoading ? 'Saving...' : 'Save Form'}
              </NeuroButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}