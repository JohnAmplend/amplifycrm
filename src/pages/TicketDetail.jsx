import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Clock, User } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroSelect from "../components/crm/NeuroSelect";

export default function TicketDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ticketId, setTicketId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("Public Reply");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    setTicketId(urlParams.get('id'));
  }, []);

  const { data: ticket } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => base44.entities.Ticket.filter({ id: ticketId }),
    enabled: !!ticketId,
    select: (data) => data[0]
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['ticket_comments', ticketId],
    queryFn: () => base44.entities.Ticket_Comment.filter({ ticket_id: ticketId }, '-created_date'),
    enabled: !!ticketId
  });

  const { data: contact } = useQuery({
    queryKey: ['contact', ticket?.contact_id],
    queryFn: () => base44.entities.Contact.filter({ id: ticket.contact_id }),
    enabled: !!ticket?.contact_id,
    select: (data) => data[0]
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ field, value }) => base44.entities.Ticket.update(ticketId, { [field]: value }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', ticketId]);
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Ticket_Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket_comments', ticketId]);
      setNewComment("");
      
      // Update first response date if not set
      if (!ticket.first_response_date) {
        updateMutation.mutate({ 
          field: 'first_response_date', 
          value: new Date().toISOString() 
        });
      }
    }
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      ticket_id: ticketId,
      comment_body: newComment,
      comment_type: commentType,
      created_by_name: currentUser?.full_name || currentUser?.email || "Unknown",
      created_by_email: currentUser?.email || "",
      is_customer_visible: commentType === "Public Reply"
    });
  };

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ field: 'status', value: newStatus });
    
    if (newStatus === 'Resolved' && !ticket.resolved_date) {
      updateMutation.mutate({ 
        field: 'resolved_date', 
        value: new Date().toISOString() 
      });
    }
  };

  if (!ticket) {
    return (
      <div className="p-8">
        <div className="text-center py-12" style={{ color: "#aaa" }}>
          Loading ticket...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <NeuroButton onClick={() => navigate(createPageUrl("AllTickets"))}>
            <ArrowLeft className="w-4 h-4" />
          </NeuroButton>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold" style={{ color: "#555" }}>
                {ticket.ticket_number}
              </h1>
              <span className={`ampvibe-button px-3 py-1 text-sm ${
                ticket.status === 'Resolved' ? 'text-green-600' :
                ticket.status === 'In Progress' ? 'text-blue-600' : ''
              }`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-lg mt-1" style={{ color: "#888" }}>
              {ticket.subject}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Description
              </h2>
              <p style={{ color: "#666", whiteSpace: "pre-wrap" }}>
                {ticket.description}
              </p>
            </NeuroCard>

            {/* Comments */}
            <NeuroCard>
              <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
                Activity ({comments.length})
              </h2>

              {/* Comment Form */}
              <div className="mb-6 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCommentType("Public Reply")}
                    className={`ampvibe-button px-4 py-2 ${commentType === "Public Reply" ? "active" : ""}`}
                  >
                    Public Reply
                  </button>
                  <button
                    onClick={() => setCommentType("Internal Note")}
                    className={`ampvibe-button px-4 py-2 ${commentType === "Internal Note" ? "active" : ""}`}
                  >
                    Internal Note
                  </button>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="ampvibe-input w-full min-h-[120px]"
                  placeholder={commentType === "Internal Note" ? "Add an internal note (only visible to agents)..." : "Write a reply to the customer..."}
                />
                <NeuroButton 
                  variant="primary" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {commentType === "Internal Note" ? "Add Note" : "Send Reply"}
                </NeuroButton>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className={`ampvibe-inset p-4 rounded-lg ${
                    comment.comment_type === "Internal Note" ? "border-2 border-amber-200" : ""
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="ampvibe-button p-2 rounded-lg">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: "#666" }}>
                            {comment.created_by_name}
                          </p>
                          <p className="text-xs" style={{ color: "#888" }}>
                            {new Date(comment.created_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {comment.comment_type === "Internal Note" && (
                        <span className="ampvibe-button px-2 py-1 text-xs text-amber-600">
                          Internal Note
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#666", whiteSpace: "pre-wrap" }}>
                      {comment.comment_body}
                    </p>
                  </div>
                ))}
              </div>
            </NeuroCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Properties */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Properties
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm mb-2" style={{ color: "#888" }}>Status</p>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="ampvibe-input w-full"
                  >
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting on Customer">Waiting on Customer</option>
                    <option value="Waiting on Third Party">Waiting on Third Party</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <p className="text-sm mb-2" style={{ color: "#888" }}>Priority</p>
                  <select
                    value={ticket.priority}
                    onChange={(e) => updateMutation.mutate({ field: 'priority', value: e.target.value })}
                    className="ampvibe-input w-full"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <p className="text-sm mb-2" style={{ color: "#888" }}>Assigned To</p>
                  <select
                    value={ticket.assigned_to || ""}
                    onChange={(e) => updateMutation.mutate({ field: 'assigned_to', value: e.target.value })}
                    className="ampvibe-input w-full"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.email} value={u.email}>
                        {u.full_name || u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-sm mb-1" style={{ color: "#888" }}>Type</p>
                  <span className="ampvibe-button px-2 py-1 text-sm">{ticket.ticket_type}</span>
                </div>

                <div>
                  <p className="text-sm mb-1" style={{ color: "#888" }}>Category</p>
                  <span className="ampvibe-button px-2 py-1 text-sm">{ticket.category}</span>
                </div>
              </div>
            </NeuroCard>

            {/* Requester Info */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Requester
              </h3>
              {contact ? (
                <div>
                  <p className="font-medium mb-1" style={{ color: "#666" }}>
                    {contact.first_name} {contact.last_name}
                  </p>
                  <p className="text-sm" style={{ color: "#888" }}>{contact.email}</p>
                  <NeuroButton 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={() => navigate(createPageUrl("ContactDetail") + `?id=${contact.id}`)}
                  >
                    View Contact
                  </NeuroButton>
                </div>
              ) : ticket.requester_name ? (
                <div>
                  <p className="font-medium mb-1" style={{ color: "#666" }}>
                    {ticket.requester_name}
                  </p>
                  <p className="text-sm" style={{ color: "#888" }}>{ticket.requester_email}</p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#aaa" }}>No requester information</p>
              )}
            </NeuroCard>

            {/* Timeline */}
            <NeuroCard>
              <h3 className="font-bold mb-4" style={{ color: "#666" }}>
                Timeline
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "#888" }} />
                  <div>
                    <p style={{ color: "#888" }}>Created</p>
                    <p style={{ color: "#666" }}>{new Date(ticket.created_date).toLocaleString()}</p>
                  </div>
                </div>
                {ticket.first_response_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: "#888" }} />
                    <div>
                      <p style={{ color: "#888" }}>First Response</p>
                      <p style={{ color: "#666" }}>{new Date(ticket.first_response_date).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {ticket.resolved_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: "#888" }} />
                    <div>
                      <p style={{ color: "#888" }}>Resolved</p>
                      <p style={{ color: "#666" }}>{new Date(ticket.resolved_date).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </NeuroCard>
          </div>
        </div>
      </div>
    </div>
  );
}