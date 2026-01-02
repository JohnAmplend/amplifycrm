import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";
import NeuroButton from "./NeuroButton";

export default function DealForm({ deal, onSubmit, onCancel, currentUser }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deal_name: "",
    deal_amount: "",
    close_date: "",
    deal_stage: "Appointment Scheduled",
    pipeline: "Sales Pipeline",
    probability: 10,
    contact_id: "",
    company_id: "",
    deal_owner: currentUser?.email || "",
    deal_type: "New Business",
    priority: "Medium",
    next_step: "",
    ...deal
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NeuroInput
          label="Deal Name"
          value={formData.deal_name}
          onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
          required
        />
        <NeuroInput
          label="Deal Amount"
          type="number"
          value={formData.deal_amount}
          onChange={(e) => setFormData({ ...formData, deal_amount: parseFloat(e.target.value) })}
          placeholder="USD"
        />
        <NeuroInput
          label="Close Date"
          type="date"
          value={formData.close_date}
          onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
        />
        <NeuroSelect
          label="Deal Stage"
          value={formData.deal_stage}
          onChange={(e) => setFormData({ ...formData, deal_stage: e.target.value })}
          options={[
            { value: 'Appointment Scheduled', label: 'Appointment Scheduled' },
            { value: 'Qualified', label: 'Qualified' },
            { value: 'Presentation Scheduled', label: 'Presentation Scheduled' },
            { value: 'Decision Maker Bought-In', label: 'Decision Maker Bought-In' },
            { value: 'Contract Sent', label: 'Contract Sent' },
            { value: 'Closed Won', label: 'Closed Won' },
            { value: 'Closed Lost', label: 'Closed Lost' }
          ]}
        />
        <NeuroSelect
          label="Contact"
          value={formData.contact_id}
          onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
          options={contacts.map(c => ({ 
            value: c.id, 
            label: `${c.first_name} ${c.last_name}` 
          }))}
        />
        <NeuroSelect
          label="Company"
          value={formData.company_id}
          onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
          options={companies.map(c => ({ value: c.id, label: c.company_name }))}
        />
        <NeuroSelect
          label="Deal Owner"
          value={formData.deal_owner}
          onChange={(e) => setFormData({ ...formData, deal_owner: e.target.value })}
          options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
        />
        <NeuroSelect
          label="Deal Type"
          value={formData.deal_type}
          onChange={(e) => setFormData({ ...formData, deal_type: e.target.value })}
          options={[
            { value: 'New Business', label: 'New Business' },
            { value: 'Existing Business', label: 'Existing Business' },
            { value: 'Renewal', label: 'Renewal' }
          ]}
        />
        <NeuroSelect
          label="Priority"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          options={[
            { value: 'Low', label: 'Low' },
            { value: 'Medium', label: 'Medium' },
            { value: 'High', label: 'High' }
          ]}
        />
        <NeuroInput
          label="Probability (%)"
          type="number"
          min="0"
          max="100"
          value={formData.probability}
          onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
        />
        <div className="md:col-span-2">
          <NeuroInput
            label="Next Step"
            value={formData.next_step}
            onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
            placeholder="What's the next action to move this deal forward?"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <NeuroButton type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </NeuroButton>
        <NeuroButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : deal ? 'Update' : 'Create'} Deal
        </NeuroButton>
      </div>
    </form>
  );
}