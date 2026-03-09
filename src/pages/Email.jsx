import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Mail, Settings, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmailConnectPrompt from "@/components/email/EmailConnectPrompt";
import EmailList from "@/components/email/EmailList";
import EmailDetail from "@/components/email/EmailDetail";

export default function Email() {
  const [loading, setLoading] = useState(true);
  const [gmailAccount, setGmailAccount] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("inbox");
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const accounts = await base44.entities.GmailAccount.filter({ user_email: user.email });
      if (accounts.length > 0) {
        setGmailAccount(accounts[0]);
        await loadMessages(accounts[0].id);
      }
    } catch (error) {
      console.error("Failed to load email data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (accountId) => {
    try {
      const msgs = await base44.entities.EmailMessage.filter(
        { gmail_account_id: accountId },
        "-internal_date",
        100
      );
      setMessages(msgs || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const syncMessages = async () => {
    if (!gmailAccount) return;
    setSyncing(true);
    try {
      const response = await base44.functions.invoke("gmail/syncGmailMessages", {
        gmail_account_id: gmailAccount.id
      });
      if (response.data?.success) {
        toast.success(`Synced ${response.data.total_messages} messages`);
        await loadMessages(gmailAccount.id);
      } else {
        toast.error(response.data?.error || "Sync failed");
      }
    } catch (error) {
      toast.error("Sync failed: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const disconnectGmail = async () => {
    if (!gmailAccount) return;
    try {
      await base44.entities.GmailAccount.delete(gmailAccount.id);
      setGmailAccount(null);
      setMessages([]);
      setSelectedMessage(null);
      toast.success("Gmail disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Gmail");
    }
  };

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    setShowDetail(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!gmailAccount) {
    return (
      <div className="p-6">
        <EmailConnectPrompt />
      </div>
    );
  }

  return (
    <div className="p-4 h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
      <div className="ampvibe-card px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)'
          }}>
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E3A8A" }}>Email Inbox</h1>
            <p className="text-xs" style={{ color: "#888" }}>{gmailAccount.user_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {gmailAccount.last_sync_at && (
            <span className="text-xs hidden sm:block" style={{ color: "#aaa" }}>
              Last synced: {new Date(gmailAccount.last_sync_at).toLocaleString()}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={disconnectGmail} className="gap-1 text-xs text-red-500 hover:text-red-700">
            <LogOut className="w-3 h-3" />
            Disconnect
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Email list */}
        <div className={`ampvibe-card flex-shrink-0 overflow-hidden flex flex-col ${showDetail ? 'hidden md:flex w-80 lg:w-96' : 'w-full'}`}>
          <EmailList
            messages={messages}
            selectedId={selectedMessage?.id}
            onSelect={handleSelectMessage}
            onSync={syncMessages}
            syncing={syncing}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>

        {/* Email detail */}
        <div className={`ampvibe-card flex-1 overflow-hidden flex flex-col ${showDetail ? 'flex' : 'hidden md:flex'}`}>
          <EmailDetail
            message={selectedMessage}
            onClose={() => { setShowDetail(false); setSelectedMessage(null); }}
          />
        </div>
      </div>
    </div>
  );
}