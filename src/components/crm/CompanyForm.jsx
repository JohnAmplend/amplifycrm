import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import NeuroInput from "./NeuroInput";
import NeuroSelect from "./NeuroSelect";
import NeuroButton from "./NeuroButton";

export default function CompanyForm({ company, onSubmit, onCancel, currentUser }) {
  const [formData, setFormData] = useState({
    company_name: "",
    domain: "",
    industry: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    number_of_employees: "",
    annual_revenue: "",
    company_owner: currentUser?.email || "",
    lifecycle_stage: "Lead",
    ...company
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NeuroInput
          label="Company Name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          required
        />
        <NeuroInput
          label="Domain"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          placeholder="example.com"
        />
        <NeuroInput
          label="Industry"
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
        />
        <NeuroInput
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
        <NeuroInput
          label="Number of Employees"
          type="number"
          value={formData.number_of_employees}
          onChange={(e) => setFormData({ ...formData, number_of_employees: e.target.value })}
        />
        <NeuroInput
          label="Annual Revenue"
          type="number"
          value={formData.annual_revenue}
          onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
          placeholder="USD"
        />
        <NeuroSelect
          label="Company Owner"
          value={formData.company_owner}
          onChange={(e) => setFormData({ ...formData, company_owner: e.target.value })}
          options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
        />
        <NeuroSelect
          label="Lifecycle Stage"
          value={formData.lifecycle_stage}
          onChange={(e) => setFormData({ ...formData, lifecycle_stage: e.target.value })}
          options={[
            { value: 'Lead', label: 'Lead' },
            { value: 'Opportunity', label: 'Opportunity' },
            { value: 'Customer', label: 'Customer' },
            { value: 'Evangelist', label: 'Evangelist' }
          ]}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <NeuroButton type="button" onClick={onCancel}>
          Cancel
        </NeuroButton>
        <NeuroButton type="submit" variant="primary">
          {company ? 'Update' : 'Create'} Company
        </NeuroButton>
      </div>
    </form>
  );
}