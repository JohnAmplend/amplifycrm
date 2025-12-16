import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, User, Clock, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import ChatConversation from "../components/crm/ChatConversation";
import moment from "moment";

export default function ChatInbox() {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['chat-sessions', statusFilter],
    queryFn: async () => {
      const allSessions = await base44.entities.ChatSession.list('-last_activity_time');
      if (statusFilter === 'all') return allSessions;
      return allSessions.filter(s => s.status === statusFilter);
    },
    refetchInterval: 3000 // Poll every 3 seconds for new messages
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-chat'],
    queryFn: () => base44.entities.Contact.list()
  });

  const assignMutation = useMutation({
    mutationFn: async ({ session_id, assigned_to }) => {
      const response = await base44.functions.invoke('chat/updateChatSession', {
        session_id,
        updates: { assigned_to, status: 'Assigned' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-sessions']);
    }
  });

  const closeMutation = useMutation({
    mutationFn: async (session_id) => {
      const response = await base44.functions.invoke('chat/updateChatSession', {
        session_id,
        updates: { status: 'Closed', end_time: new Date().toISOString() }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-sessions']);
      setSelectedSession(null);
    }
  });

  const filteredSessions = sessions.filter(session => {
    const searchLower = searchTerm.toLowerCase();
    return (
      session.visitor_name?.toLowerCase().includes(searchLower) ||
      session.visitor_email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return '#f59e0b';
      case 'Assigned': return '#4a90e2';
      case 'Closed': return '#52c41a';
      default: return '#888';
    }
  };

  const handleAssignToMe = (session) => {
    if (currentUser) {
      assignMutation.mutate({
        session_id: session.session_id,
        assigned_to: currentUser.email
      });
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#555" }}>Chat Inbox</h1>
            <p style={{ color: "#888" }}>Manage live chat conversations</p>
          </div>
          <NeuroButton onClick={() => window.open('/ChatWidget', '_blank')}>
            View Widget Demo
          </NeuroButton>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <NeuroCard>
              <div className="mb-4">
                <div className="ampvibe-input flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4" style={{ color: "#888" }} />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {['all', 'Open', 'Assigned', 'Closed'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`ampvibe-button px-3 py-1 text-sm ${statusFilter === status ? 'active' : ''}`}
                    >
                      {status === 'all' ? 'All' : status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-8" style={{ color: "#aaa" }}>
                    Loading...
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: "#ccc" }} />
                    <p style={{ color: "#888" }}>No chat sessions</p>
                  </div>
                ) : (
                  filteredSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`ampvibe-inset p-3 rounded-lg cursor-pointer ${selectedSession?.id === session.id ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate" style={{ color: "#666" }}>
                            {session.visitor_name || 'Anonymous'}
                          </p>
                          <p className="text-xs truncate" style={{ color: "#888" }}>
                            {session.visitor_email || 'No email'}
                          </p>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: `${getStatusColor(session.status)}20`,
                            color: getStatusColor(session.status)
                          }}
                        >
                          {session.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "#aaa" }}>
                        <Clock className="w-3 h-3" />
                        {moment(session.last_activity_time).fromNow()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </NeuroCard>
          </div>

          {/* Conversation View */}
          <div className="lg:col-span-2">
            {!selectedSession ? (
              <NeuroCard>
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: "#ccc" }} />
                  <p className="text-lg" style={{ color: "#888" }}>
                    Select a chat session to view conversation
                  </p>
                </div>
              </NeuroCard>
            ) : (
              <ChatConversation
                session={selectedSession}
                currentUser={currentUser}
                contacts={contacts}
                onAssignToMe={() => handleAssignToMe(selectedSession)}
                onClose={() => closeMutation.mutate(selectedSession.session_id)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}