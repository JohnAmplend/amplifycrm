import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Filter } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function AllTickets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssigned, setFilterAssigned] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    
    if (filter === 'unassigned') {
      setFilterAssigned('unassigned');
    } else if (filter === 'high_priority') {
      setFilterPriority('High');
    } else if (filter === 'overdue') {
      // Handle overdue filter
    }
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || ticket.status === filterStatus;
    const matchesPriority = !filterPriority || ticket.priority === filterPriority;
    const matchesAssigned = !filterAssigned || 
      (filterAssigned === 'unassigned' ? !ticket.assigned_to : ticket.assigned_to === filterAssigned);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssigned;
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              All Tickets
            </h1>
            <p style={{ color: "#888" }}>{filteredTickets.length} tickets</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("CreateTicket"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket
          </NeuroButton>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ampvibe-input w-full pl-12"
              />
            </div>
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Open', label: 'Open' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Waiting on Customer', label: 'Waiting on Customer' },
                { value: 'Resolved', label: 'Resolved' },
                { value: 'Closed', label: 'Closed' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Urgent', label: 'Urgent' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by assigned"
              value={filterAssigned}
              onChange={(e) => setFilterAssigned(e.target.value)}
              options={[
                { value: 'unassigned', label: 'Unassigned' },
                ...users.map(u => ({ value: u.email, label: u.full_name || u.email }))
              ]}
            />
          </div>
        </NeuroCard>

        {/* Tickets Table */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4" style={{ color: "#aaa" }}>No tickets found</p>
              <NeuroButton onClick={() => navigate(createPageUrl("CreateTicket"))}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Ticket
              </NeuroButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Ticket #</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Subject</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Priority</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Type</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Assigned To</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(createPageUrl("TicketDetail") + `?id=${ticket.id}`)}
                      className="border-b cursor-pointer hover:bg-white hover:bg-opacity-50 transition-colors"
                      style={{ borderColor: "rgba(30, 58, 138, 0.05)" }}
                    >
                      <td className="py-3 px-4 font-mono text-sm" style={{ color: "#4a90e2" }}>
                        {ticket.ticket_number}
                      </td>
                      <td className="py-3 px-4" style={{ color: "#666" }}>
                        <p className="font-medium">{ticket.subject}</p>
                        {ticket.requester_name && (
                          <p className="text-sm" style={{ color: "#888" }}>{ticket.requester_name}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`ampvibe-button px-2 py-1 text-xs ${
                          ticket.status === 'Resolved' ? 'text-green-600' :
                          ticket.status === 'Closed' ? 'text-gray-600' :
                          ticket.status === 'In Progress' ? 'text-blue-600' : ''
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`ampvibe-button px-2 py-1 text-xs ${
                          ticket.priority === 'Urgent' ? 'text-red-600' :
                          ticket.priority === 'High' ? 'text-orange-600' : ''
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#888" }}>
                        {ticket.ticket_type}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#888" }}>
                        {ticket.assigned_to ? 
                          users.find(u => u.email === ticket.assigned_to)?.full_name || ticket.assigned_to 
                          : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: "#888" }}>
                        {new Date(ticket.created_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}