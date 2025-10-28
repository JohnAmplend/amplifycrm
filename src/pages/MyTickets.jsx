import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function MyTickets() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my_tickets', currentUser?.email],
    queryFn: () => base44.entities.Ticket.filter({ assigned_to: currentUser?.email }, '-created_date'),
    enabled: !!currentUser?.email
  });

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || ticket.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              My Tickets
            </h1>
            <p style={{ color: "#888" }}>{filteredTickets.length} tickets assigned to you</p>
          </div>
        </div>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </NeuroCard>

        {/* Tickets Table */}
        <NeuroCard>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: "#aaa" }}>
              Loading your tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: "#aaa" }}>No tickets assigned to you</p>
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
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>SLA Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const isOverdue = ticket.sla_due_date && new Date(ticket.sla_due_date) < new Date();
                    
                    return (
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
                        </td>
                        <td className="py-3 px-4">
                          <span className={`ampvibe-button px-2 py-1 text-xs ${
                            ticket.status === 'Resolved' ? 'text-green-600' :
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
                        <td className="py-3 px-4 text-sm">
                          {ticket.sla_due_date ? (
                            <span className={isOverdue ? 'text-red-600 font-bold' : ''} style={{ color: isOverdue ? '#f5222d' : '#888' }}>
                              {new Date(ticket.sla_due_date).toLocaleDateString()}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>
      </div>
    </div>
  );
}