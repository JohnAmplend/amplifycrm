import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, RefreshCw, Calendar, User } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import moment from "moment";

export default function Email() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: gmailAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['gmailAccounts'],
    queryFn: () => base44.entities.GmailAccount.list(),
    enabled: !!user
  });

  const gmailAccount = gmailAccounts[0];

  const { data: emailMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['emailMessages', gmailAccount?.id],
    queryFn: () => base44.entities.EmailMessage.filter({ gmail_account_id: gmailAccount.id }),
    enabled: !!gmailAccount
  });

  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('gmail/getGmailAuthUrl', {});
      return response.data;
    },
    onSuccess: (data) => {
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('gmail/syncGmailMessages', {
        gmail_account_id: gmailAccount.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['emailMessages']);
      queryClient.invalidateQueries(['gmailAccounts']);
    }
  });

  const handleConnectGmail = () => {
    connectGmailMutation.mutate();
  };

  const handleSync = () => {
    syncMutation.mutate();
  };

  if (accountsLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#00A86B" }} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Email
            </h1>
            {gmailAccount && (
              <p style={{ color: "#888" }}>
                Connected: {gmailAccount.user_email}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {!gmailAccount ? (
              <NeuroButton 
                variant="primary" 
                onClick={handleConnectGmail}
                disabled={connectGmailMutation.isPending}
              >
                {connectGmailMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Connect Gmail
                  </>
                )}
              </NeuroButton>
            ) : (
              <NeuroButton 
                variant="primary" 
                onClick={handleSync}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </NeuroButton>
            )}
          </div>
        </div>

        {!gmailAccount ? (
          <NeuroCard>
            <div className="text-center py-16">
              <div className="ampvibe-inset w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-10 h-10" style={{ color: "#00A86B" }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#666" }}>
                Connect Your Gmail
              </h2>
              <p className="mb-6" style={{ color: "#888" }}>
                Connect your Gmail account to sync and view your emails in the CRM
              </p>
              <NeuroButton 
                variant="primary" 
                onClick={handleConnectGmail}
                disabled={connectGmailMutation.isPending}
              >
                <Mail className="w-4 h-4 mr-2" />
                Connect Gmail
              </NeuroButton>
            </div>
          </NeuroCard>
        ) : (
          <div className="space-y-3">
            {messagesLoading ? (
              <NeuroCard>
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto" style={{ color: "#00A86B" }} />
                </div>
              </NeuroCard>
            ) : emailMessages.length === 0 ? (
              <NeuroCard>
                <div className="text-center py-16">
                  <p style={{ color: "#888" }}>No emails found. Click "Sync Now" to fetch messages.</p>
                </div>
              </NeuroCard>
            ) : (
              emailMessages
                .sort((a, b) => new Date(b.internal_date) - new Date(a.internal_date))
                .map((email) => (
                  <NeuroCard key={email.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg" style={{ color: "#666" }}>
                          {email.subject || "(No Subject)"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm" style={{ color: "#888" }}>
                          <Calendar className="w-4 h-4" />
                          {moment(email.internal_date).format('MMM D, YYYY h:mm A')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4" style={{ color: "#888" }} />
                        <span className="text-sm font-medium" style={{ color: "#666" }}>
                          {email.from_email}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: "#888" }}>
                        {email.snippet}
                      </p>
                      {email.label_ids && email.label_ids.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {email.label_ids.map((label, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-1 rounded-lg"
                              style={{ 
                                background: '#e3f2fd',
                                color: '#1976d2'
                              }}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </NeuroCard>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}