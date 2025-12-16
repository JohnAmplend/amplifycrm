import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, User, CheckCircle, XCircle, UserPlus, Link as LinkIcon } from "lucide-react";
import NeuroCard from "./NeuroCard";
import NeuroButton from "./NeuroButton";
import moment from "moment";

export default function ChatConversation({ session, currentUser, contacts, onAssignToMe, onClose }) {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', session.session_id],
    queryFn: async () => {
      const response = await base44.functions.invoke('chat/getChatMessages', {
        session_id: session.session_id
      });
      return response.data.messages || [];
    },
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!session
  });

  const linkedContact = contacts.find(c => c.id === session.contact_id);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const response = await base44.functions.invoke('chat/sendChatMessage', {
        session_id: session.session_id,
        sender_type: 'Agent',
        sender_id: currentUser?.email || 'unknown',
        sender_name: currentUser?.full_name || 'Agent',
        message_content: content
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages', session.session_id]);
      queryClient.invalidateQueries(['chat-sessions']);
      setMessageText('');
    }
  });

  const linkContactMutation = useMutation({
    mutationFn: async (contactId) => {
      const response = await base44.functions.invoke('chat/updateChatSession', {
        session_id: session.session_id,
        updates: { contact_id: contactId }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-sessions']);
    }
  });

  const createContactMutation = useMutation({
    mutationFn: async () => {
      const newContact = await base44.entities.Contact.create({
        first_name: session.visitor_name?.split(' ')[0] || 'Unknown',
        last_name: session.visitor_name?.split(' ').slice(1).join(' ') || 'Visitor',
        email: session.visitor_email
      });
      return newContact;
    },
    onSuccess: (newContact) => {
      linkContactMutation.mutate(newContact.id);
      queryClient.invalidateQueries(['contacts-for-chat']);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMutation.mutate(messageText.trim());
    }
  };

  return (
    <NeuroCard className="flex flex-col h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
        <div className="flex items-center gap-3">
          <div className="ampvibe-inset w-10 h-10 rounded-full flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)'
          }}>
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold" style={{ color: "#666" }}>
              {session.visitor_name || 'Anonymous Visitor'}
            </p>
            <p className="text-sm" style={{ color: "#888" }}>
              {session.visitor_email || 'No email provided'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {session.status !== 'Assigned' && (
            <NeuroButton size="sm" onClick={onAssignToMe}>
              Assign to Me
            </NeuroButton>
          )}
          {session.status !== 'Closed' && (
            <NeuroButton size="sm" onClick={onClose}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Close Chat
            </NeuroButton>
          )}
        </div>
      </div>

      {/* Contact Linking Section */}
      <div className="py-3 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
        {linkedContact ? (
          <div className="flex items-center gap-2 text-sm">
            <LinkIcon className="w-4 h-4" style={{ color: "#52c41a" }} />
            <span style={{ color: "#666" }}>
              Linked to: <strong>{linkedContact.first_name} {linkedContact.last_name}</strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm flex-1" style={{ color: "#888" }}>
              Not linked to any contact
            </p>
            {session.visitor_email && (
              <NeuroButton size="sm" onClick={() => createContactMutation.mutate()}>
                <UserPlus className="w-3 h-3 mr-1" />
                Create Contact
              </NeuroButton>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((msg) => {
          const isAgent = msg.sender_type === 'Agent';
          const isSystem = msg.sender_type === 'System';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-xs px-3 py-1 rounded-full" style={{
                  backgroundColor: '#f3f4f6',
                  color: '#888'
                }}>
                  {msg.message_content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isAgent ? 'text-right' : 'text-left'}`}>
                <div
                  className="ampvibe-inset p-3 rounded-lg inline-block"
                  style={{
                    background: isAgent 
                      ? 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)'
                      : 'rgba(255, 255, 255, 0.7)',
                    color: isAgent ? '#fff' : '#333'
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{
                    color: isAgent ? '#fff' : '#666'
                  }}>
                    {msg.sender_name}
                  </p>
                  <p>{msg.message_content}</p>
                </div>
                <p className="text-xs mt-1" style={{ color: "#aaa" }}>
                  {moment(msg.created_date).format('h:mm A')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {session.status !== 'Closed' && (
        <form onSubmit={handleSend} className="pt-4 border-t" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="ampvibe-input flex-1"
              disabled={sendMutation.isPending}
            />
            <NeuroButton 
              type="submit" 
              variant="primary" 
              disabled={!messageText.trim() || sendMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </NeuroButton>
          </div>
        </form>
      )}
    </NeuroCard>
  );
}