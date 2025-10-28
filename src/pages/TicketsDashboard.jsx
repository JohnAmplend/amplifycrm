import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Ticket, AlertCircle, Clock, TrendingUp, Plus } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import StatCard from "../components/crm/StatCard";

export default function TicketsDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date')
  });

  const openTickets = tickets.filter(t => !['Resolved', 'Closed'].includes(t.status));
  const myTickets = tickets.filter(t => t.assigned_to === currentUser?.email && !['Resolved', 'Closed'].includes(t.status));
  
  const overdueTickets = tickets.filter(t => {
    if (!t.sla_due_date || ['Resolved', 'Closed'].includes(t.status)) return false;
    return new Date(t.sla_due_date) < new Date();
  });

  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' && t.resolution_time_hours);
  const avgResolutionTime = resolvedTickets.length > 0
    ? (resolvedTickets.reduce((sum, t) => sum + t.resolution_time_hours, 0) / resolvedTickets.length).toFixed(1)
    : 0;

  const ticketsByStatus = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {});

  const recentTickets = tickets.slice(0, 10);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Service Dashboard
            </h1>
            <p style={{ color: "#888" }}>Monitor your support operations</p>
          </div>
          <NeuroButton variant="primary" onClick={() => navigate(createPageUrl("CreateTicket"))}>
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket
          </NeuroButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon={Ticket}
            title="Open Tickets"
            value={openTickets.length}
            subtitle="Active support requests"
            color="#4a90e2"
          />
          <StatCard
            icon={Ticket}
            title="My Tickets"
            value={myTickets.length}
            subtitle="Assigned to me"
            color="#00A86B"
          />
          <StatCard
            icon={AlertCircle}
            title="Overdue"
            value={overdueTickets.length}
            subtitle="Past SLA deadline"
            color="#f5222d"
          />
          <StatCard
            icon={Clock}
            title="Avg Resolution"
            value={`${avgResolutionTime}h`}
            subtitle="Average time to resolve"
            color="#fa8c16"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Quick Filters */}
          <NeuroCard>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Quick Filters
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate(createPageUrl("MyTickets"))}
                className="ampvibe-button w-full px-4 py-3 flex items-center justify-between"
              >
                <span>My Tickets</span>
                <span className="ampvibe-inset px-2 py-1 rounded text-sm font-bold">
                  {myTickets.length}
                </span>
              </button>
              <button
                onClick={() => navigate(createPageUrl("AllTickets") + "?filter=unassigned")}
                className="ampvibe-button w-full px-4 py-3 flex items-center justify-between"
              >
                <span>Unassigned</span>
                <span className="ampvibe-inset px-2 py-1 rounded text-sm font-bold">
                  {tickets.filter(t => !t.assigned_to).length}
                </span>
              </button>
              <button
                onClick={() => navigate(createPageUrl("AllTickets") + "?filter=high_priority")}
                className="ampvibe-button w-full px-4 py-3 flex items-center justify-between"
              >
                <span>High Priority</span>
                <span className="ampvibe-inset px-2 py-1 rounded text-sm font-bold">
                  {tickets.filter(t => ['High', 'Urgent'].includes(t.priority)).length}
                </span>
              </button>
              <button
                onClick={() => navigate(createPageUrl("AllTickets") + "?filter=overdue")}
                className="ampvibe-button w-full px-4 py-3 flex items-center justify-between"
              >
                <span>Overdue</span>
                <span className="ampvibe-inset px-2 py-1 rounded text-sm font-bold text-red-600">
                  {overdueTickets.length}
                </span>
              </button>
            </div>
          </NeuroCard>

          {/* Tickets by Status */}
          <NeuroCard className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
              Tickets by Status
            </h2>
            <div className="space-y-3">
              {Object.entries(ticketsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span style={{ color: "#666" }}>{status}</span>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div className="flex-1 ampvibe-inset rounded-full overflow-hidden h-2">
                      <div
                        className="h-full"
                        style={{
                          width: `${(count / tickets.length) * 100}%`,
                          background: 'linear-gradient(135deg, #00A86B 0%, #00C87A 100%)'
                        }}
                      />
                    </div>
                    <span className="font-bold" style={{ color: "#666" }}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </NeuroCard>
        </div>

        {/* Recent Activity */}
        <NeuroCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: "#666" }}>
              Recent Tickets
            </h2>
            <NeuroButton size="sm" onClick={() => navigate(createPageUrl("AllTickets"))}>
              View All
            </NeuroButton>
          </div>
          {recentTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p style={{ color: "#aaa" }}>No tickets yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Ticket</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Subject</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Priority</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket) => (
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
                        {ticket.subject}
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
                        {ticket.assigned_to || 'Unassigned'}
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