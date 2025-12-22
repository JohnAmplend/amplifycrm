import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import NeuroButton from "./NeuroButton";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";

export default function ActivityForm({ onClose, onSuccess, activity = null }) {
  const [formData, setFormData] = useState({
    activity_type: activity?.activity_type || "Note",
    direction: activity?.direction || "N/A",
    subject: activity?.subject || "",
    description: activity?.description || "",
    activity_date: activity?.activity_date ? new Date(activity.activity_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    duration_minutes: activity?.duration_minutes || "",
    status: activity?.status || "Completed",
    contact_id: activity?.contact_id || "",
    company_id: activity?.company_id || "",
    deal_id: activity?.deal_id || ""
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list()
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
      contact_id: formData.contact_id || null,
      company_id: formData.company_id || null,
      deal_id: formData.deal_id || null
    };

    if (activity) {
      await base44.entities.Activity.update(activity.id, dataToSubmit);
    } else {
      await base44.entities.Activity.create(dataToSubmit);
    }
    
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="ampvibe-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
            {activity ? "Edit Activity" : "Log Activity"}
          </h2>
          <button onClick={onClose} className="ampvibe-button p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <NeuroSelect
              label="Activity Type *"
              value={formData.activity_type}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
              options={[
                { value: 'Call', label: 'Call' },
                { value: 'Email', label: 'Email' },
                { value: 'Meeting', label: 'Meeting' },
                { value: 'Note', label: 'Note' },
                { value: 'Task', label: 'Task' }
              ]}
              required
            />

            <NeuroSelect
              label="Direction *"
              value={formData.direction}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
              options={[
                { value: 'Inbound', label: 'Inbound' },
                { value: 'Outbound', label: 'Outbound' },
                { value: 'Internal', label: 'Internal' },
                { value: 'N/A', label: 'N/A' }
              ]}
              required
            />
          </div>

          <NeuroInput
            label="Subject *"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Activity subject"
            required
          />

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="ampvibe-input w-full"
              rows="4"
              placeholder="Activity details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#666" }}>
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.activity_date}
                onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                className="ampvibe-input w-full"
                required
              />
            </div>

            <NeuroInput
              label="Duration (minutes)"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              placeholder="30"
            />
          </div>

          <NeuroSelect
            label="Status *"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'Completed', label: 'Completed' },
              { value: 'Scheduled', label: 'Scheduled' },
              { value: 'Cancelled', label: 'Cancelled' }
            ]}
            required
          />

          <NeuroSelect
            label="Related Contact"
            value={formData.contact_id}
            onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
            options={[
              { value: '', label: 'None' },
              ...contacts.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))
            ]}
          />

          <NeuroSelect
            label="Related Company"
            value={formData.company_id}
            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
            options={[
              { value: '', label: 'None' },
              ...companies.map(c => ({ value: c.id, label: c.company_name }))
            ]}
          />

          <NeuroSelect
            label="Related Deal"
            value={formData.deal_id}
            onChange={(e) => setFormData({ ...formData, deal_id: e.target.value })}
            options={[
              { value: '', label: 'None' },
              ...deals.map(d => ({ value: d.id, label: d.deal_name }))
            ]}
          />

          <div className="flex gap-3 justify-end pt-4">
            <NeuroButton type="button" onClick={onClose}>
              Cancel
            </NeuroButton>
            <NeuroButton variant="primary" type="submit">
              {activity ? "Update Activity" : "Log Activity"}
            </NeuroButton>
          </div>
        </form>
      </div>
    </div>
  );
}