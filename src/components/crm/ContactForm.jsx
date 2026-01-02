import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";
import NeuroButton from "./NeuroButton";
import { toast } from "./useToast";

export default function ContactForm({ contact, onSubmit, onCancel, currentUser }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile: "",
    job_title: "",
    department: "",
    company_id: "",
    contact_owner: currentUser?.email || "",
    lifecycle_stage: "Lead",
    lead_status: "New",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    linkedin_url: "",
    twitter_handle: "",
    ...contact
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
    } catch (error) {
      toast.error('Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show warning if lifecycle stage is Lead
  const isLeadStage = formData.lifecycle_stage === 'Lead';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isLeadStage && !contact && (
        <div className="ampvibe-inset p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-600 mb-1">Creating as Lead</p>
            <p className="text-sm" style={{ color: "#666" }}>
              Since the lifecycle stage is "Lead", this record will be created in the Leads section instead of Contacts. You'll be redirected to the Leads page after creation.
            </p>
          </div>
        </div>
      )}

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
          label="Mobile"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
        />
        <NeuroInput
          label="Job Title"
          value={formData.job_title}
          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
        />
        <NeuroInput
          label="Department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
        />
        <NeuroSelect
          label="Company"
          value={formData.company_id}
          onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
          options={companies.map(c => ({ value: c.id, label: c.company_name }))}
        />
        <NeuroSelect
          label="Contact Owner"
          value={formData.contact_owner}
          onChange={(e) => setFormData({ ...formData, contact_owner: e.target.value })}
          options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
        />
        <NeuroSelect
          label="Lifecycle Stage"
          value={formData.lifecycle_stage}
          onChange={(e) => setFormData({ ...formData, lifecycle_stage: e.target.value })}
          options={[
            { value: 'Subscriber', label: 'Subscriber' },
            { value: 'Lead', label: 'Lead (will create as Lead record)' },
            { value: 'MQL', label: 'MQL' },
            { value: 'SQL', label: 'SQL' },
            { value: 'Opportunity', label: 'Opportunity' },
            { value: 'Customer', label: 'Customer' }
          ]}
        />
        <NeuroSelect
          label="Lead Status"
          value={formData.lead_status}
          onChange={(e) => setFormData({ ...formData, lead_status: e.target.value })}
          options={[
            { value: 'New', label: 'New' },
            { value: 'Attempting', label: 'Attempting' },
            { value: 'Connected', label: 'Connected' },
            { value: 'Qualified', label: 'Qualified' },
            { value: 'Unqualified', label: 'Unqualified' }
          ]}
        />
        <NeuroInput
          label="LinkedIn URL"
          value={formData.linkedin_url}
          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
        />
        <NeuroInput
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
        <NeuroInput
          label="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
        <NeuroInput
          label="State"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
        />
        <NeuroInput
          label="Zip"
          value={formData.zip}
          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
        />
        <NeuroInput
          label="Country"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <NeuroButton type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </NeuroButton>
        <NeuroButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : contact ? 'Update' : isLeadStage ? 'Create as Lead' : 'Create'} Contact
        </NeuroButton>
      </div>
    </form>
  );
}