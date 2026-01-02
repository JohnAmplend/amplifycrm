import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";
import NeuroButton from "./NeuroButton";

export default function LeadForm({ lead, onSubmit, onCancel, currentUser }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    job_title: "",
    lead_source: "Website",
    lead_status: "New",
    lead_score: 0,
    lead_owner: currentUser?.email || "",
    ...lead
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
          label="First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
        />
        <NeuroInput
          label="Last Name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
        />
        <NeuroInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <NeuroInput
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <NeuroInput
          label="Company Name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
        />
        <NeuroInput
          label="Job Title"
          value={formData.job_title}
          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
        />
        <NeuroSelect
          label="Lead Source"
          value={formData.lead_source}
          onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
          options={[
            { value: 'Website', label: 'Website' },
            { value: 'Referral', label: 'Referral' },
            { value: 'Social Media', label: 'Social Media' },
            { value: 'Cold Call', label: 'Cold Call' },
            { value: 'Event', label: 'Event' },
            { value: 'Form', label: 'Form' }
          ]}
        />
        <NeuroSelect
          label="Lead Status"
          value={formData.lead_status}
          onChange={(e) => setFormData({ ...formData, lead_status: e.target.value })}
          options={[
            { value: 'New', label: 'New' },
            { value: 'Attempting Contact', label: 'Attempting Contact' },
            { value: 'Connected', label: 'Connected' },
            { value: 'Qualified', label: 'Qualified' },
            { value: 'Unqualified', label: 'Unqualified' }
          ]}
        />
        <NeuroInput
          label="Lead Score"
          type="number"
          min="0"
          max="100"
          value={formData.lead_score}
          onChange={(e) => setFormData({ ...formData, lead_score: parseInt(e.target.value) })}
        />
        <NeuroSelect
          label="Lead Owner"
          value={formData.lead_owner}
          onChange={(e) => setFormData({ ...formData, lead_owner: e.target.value })}
          options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <NeuroButton type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </NeuroButton>
        <NeuroButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : lead ? 'Update' : 'Create'} Lead
        </NeuroButton>
      </div>
    </form>
  );
}