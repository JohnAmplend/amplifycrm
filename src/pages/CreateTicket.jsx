import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Save, Send } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function CreateTicket() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "Medium",
    ticket_type: "Question",
    category: "General",
    source: "Manual",
    contact_id: "",
    company_id: "",
    assigned_to: "",
    requester_email: "",
    requester_name: "",
    tags: []
  });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Generate ticket number
      const allTickets = await base44.entities.Ticket.list();
      const ticketNumber = `TICKET-${String(allTickets.length + 1).padStart(4, '0')}`;
      
      return base44.entities.Ticket.create({
        ...data,
        ticket_number: ticketNumber,
        status: 'New'
      });
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries(['tickets']);
      navigate(createPageUrl("TicketDetail") + `?id=${ticket.id}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("AllTickets"))}>
            <ArrowLeft className="w-4 h-4" />
          </NeuroButton>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
              Create Ticket
            </h1>
            <p style={{ color: "#888" }}>Submit a new support request</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <NeuroCard>
                <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                  Ticket Details
                </h2>
                <div className="space-y-6">
                  <NeuroInput
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    placeholder="Brief description of the issue"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: "#333" }}>
                      Description <span style={{ color: "#f5222d" }}>*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="ampvibe-input w-full min-h-[200px]"
                      placeholder="Provide detailed information about the issue..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <NeuroSelect
                      label="Priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      options={[
                        { value: 'Low', label: 'Low' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'High', label: 'High' },
                        { value: 'Urgent', label: 'Urgent' }
                      ]}
                      required
                    />

                    <NeuroSelect
                      label="Type"
                      value={formData.ticket_type}
                      onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                      options={[
                        { value: 'Technical Issue', label: 'Technical Issue' },
                        { value: 'Billing', label: 'Billing' },
                        { value: 'Question', label: 'Question' },
                        { value: 'Feature Request', label: 'Feature Request' },
                        { value: 'Bug Report', label: 'Bug Report' },
                        { value: 'Other', label: 'Other' }
                      ]}
                      required
                    />
                  </div>

                  <NeuroSelect
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    options={[
                      { value: 'Product', label: 'Product' },
                      { value: 'Service', label: 'Service' },
                      { value: 'General', label: 'General' }
                    ]}
                    required
                  />
                </div>
              </NeuroCard>

              <NeuroCard>
                <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                  Requester Information
                </h2>
                <div className="space-y-6">
                  <NeuroSelect
                    label="Contact (Optional)"
                    value={formData.contact_id}
                    onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                    options={contacts.map(c => ({ 
                      value: c.id, 
                      label: `${c.first_name} ${c.last_name} - ${c.email}` 
                    }))}
                  />

                  {!formData.contact_id && (
                    <div className="ampvibe-inset p-4 rounded-lg space-y-4">
                      <p className="text-sm" style={{ color: "#666" }}>
                        For non-contact requests, provide requester details:
                      </p>
                      <NeuroInput
                        label="Requester Name"
                        value={formData.requester_name}
                        onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                        placeholder="John Doe"
                      />
                      <NeuroInput
                        label="Requester Email"
                        type="email"
                        value={formData.requester_email}
                        onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  )}

                  <NeuroSelect
                    label="Company (Optional)"
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    options={companies.map(c => ({ value: c.id, label: c.company_name }))}
                  />
                </div>
              </NeuroCard>
            </div>

            <div className="space-y-6">
              <NeuroCard>
                <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                  Assignment
                </h3>
                <NeuroSelect
                  label="Assign To"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
                />
              </NeuroCard>

              <div className="flex flex-col gap-3">
                <NeuroButton type="submit" variant="primary" disabled={createMutation.isLoading}>
                  <Send className="w-4 h-4 mr-2" />
                  {createMutation.isLoading ? 'Creating...' : 'Create Ticket'}
                </NeuroButton>
                <NeuroButton type="button" onClick={() => navigate(createPageUrl("AllTickets"))}>
                  Cancel
                </NeuroButton>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}