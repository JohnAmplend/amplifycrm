import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Star, Send, Inbox, RefreshCw, Search, ChevronLeft, Reply, Forward, Trash2, Plus, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

const GOOGLE_CLIENT_ID = "1098736480238-46d7qllnh6ttgv4rdvrtelrt1qasdlde.apps.googleusercontent.com";

export default function EmailInbox() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [folder, setFolder] = useState("inbox");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [gmailConnection, setGmailConnection] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (currentUser) loadEmails(); }, [folder, currentUser]);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "GMAIL_AUTH_SUCCESS") loadData();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const pollForConnection = (popup) => {
    const interval = setInterval(async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) { clearInterval(interval); return; }
      const connections = await base44.entities.GmailAccount.filter({ user_email: user.email }).catch(() => []);
      if (connections.length > 0) {
        setGmailConnection(connections[0]);
        clearInterval(interval);
      }
      if (popup?.closed) clearInterval(interval);
    }, 2000);
    setTimeout(() => clearInterval(interval), 120000); // stop after 2 min
  };

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const connections = await base44.entities.GmailAccount.filter({ user_email: user.email });
      if (connections.length > 0) setGmailConnection(connections[0]);
    } catch (err) { console.error(err); }
  };

  const loadEmails = async () => {
    setLoading(true);
    try {
      // Use the Gmail account's email (not CRM login email) since that's what's stored on EmailMessage records
      const gmailEmail = gmailConnection?.user_email || currentUser.email;
      const allEmails = await base44.entities.EmailMessage.filter({ user_email: gmailEmail });
      let filtered = allEmails;
      if (folder === "inbox") filtered = allEmails.filter(e => e.direction === "inbound");
      if (folder === "sent") filtered = allEmails.filter(e => e.direction === "outbound");
      if (folder === "starred") filtered = allEmails.filter(e => e.is_starred);
      filtered.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
      setEmails(filtered);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const connectGmail = () => {
    const redirectUri = "https://crm.amplend.net/gmailcallback";
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid"
    ].join(" ");
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", JSON.stringify({ user_id: currentUser?.id }));
    const popup = window.open(authUrl.toString(), "gmail_auth", "width=600,height=700,scrollbars=yes");
    if (!popup) { alert("Please allow popups to connect Gmail."); return; }
    pollForConnection(popup);
  };

  const syncEmails = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const conn = gmailConnection;
      const tokenExpiry = new Date(conn.expires_at);
      let token = conn.access_token;
      if (tokenExpiry < new Date(Date.now() + 60000)) {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            refresh_token: conn.refresh_token,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: "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",
            grant_type: "refresh_token",
          }),
        });
        const tokens = await tokenRes.json();
        if (!tokens.error) {
          token = tokens.access_token;
          await base44.entities.GmailAccount.update(conn.id, {
            access_token: tokens.access_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          });
        }
      }

      const [inboxRes, sentRes] = await Promise.all([
        fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=SENT", {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      const inboxData = await inboxRes.json();
      const sentData = await sentRes.json();
      const allMessages = [...(inboxData.messages || []), ...(sentData.messages || [])];

      const existing = await base44.entities.EmailMessage.filter({ user_email: conn.user_email });
      const existingIds = new Set(existing.map(m => m.gmail_message_id));
      const seenIds = new Set();
      const newMessages = allMessages.filter(m => {
        if (seenIds.has(m.id) || existingIds.has(m.id)) return false;
        seenIds.add(m.id);
        return true;
      });

      for (const msg of newMessages) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const fromRaw = getHeader("From");
        const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/) || [null, "", fromRaw];
        const fromName = fromMatch[1].replace(/"/g, "").trim();
        const fromEmail = (fromMatch[2] || fromRaw).trim();
        const toRaw = getHeader("To");
        const toEmails = toRaw ? toRaw.split(",").map(e => e.trim().replace(/.*<(.+)>/, "$1").trim()) : [];
        const ccRaw = getHeader("Cc");
        const ccEmails = ccRaw ? ccRaw.split(",").map(e => e.trim().replace(/.*<(.+)>/, "$1").trim()) : [];

        let bodyText = "", bodyHtml = "";
        const decodeB64 = (str) => {
          try { return atob(str.replace(/-/g, "+").replace(/_/g, "/")); } catch { return ""; }
        };
        const extractBody = (payload) => {
          if (payload.body?.data) {
            if (payload.mimeType === "text/html") bodyHtml = decodeB64(payload.body.data);
            else bodyText = decodeB64(payload.body.data);
          }
          if (payload.parts) {
            payload.parts.forEach(p => {
              if (p.mimeType === "text/plain" && p.body?.data) bodyText = decodeB64(p.body.data);
              else if (p.mimeType === "text/html" && p.body?.data) bodyHtml = decodeB64(p.body.data);
              else if (p.parts) p.parts.forEach(sp => {
                if (sp.mimeType === "text/plain" && sp.body?.data) bodyText = decodeB64(sp.body.data);
                else if (sp.mimeType === "text/html" && sp.body?.data) bodyHtml = decodeB64(sp.body.data);
              });
            });
          }
        };
        extractBody(msgData.payload);

        const isOwner = fromEmail.toLowerCase() === conn.user_email?.toLowerCase();
        const direction = isOwner ? "outbound" : "inbound";
        const hasAttachments = (msgData.payload?.parts || []).some(p => p.filename && p.filename.length > 0);

        await base44.entities.EmailMessage.create({
          gmail_message_id: msg.id,
          gmail_thread_id: msgData.threadId,
          gmail_label_ids: msgData.labelIds || [],
          from_email: fromEmail,
          from_name: fromName,
          to_emails: toEmails,
          cc_emails: ccEmails,
          bcc_emails: [],
          subject: getHeader("Subject"),
          body_text: bodyText,
          body_html: bodyHtml,
          snippet: msgData.snippet,
          sent_at: getHeader("Date") ? new Date(getHeader("Date")).toISOString() : new Date().toISOString(),
          is_read: !(msgData.labelIds || []).includes("UNREAD"),
          is_starred: (msgData.labelIds || []).includes("STARRED"),
          direction,
          user_email: conn.user_email,
          has_attachments: hasAttachments,
          in_reply_to: getHeader("In-Reply-To") || null,
          sync_status: "synced",
        });
      }

      await base44.entities.GmailAccount.update(conn.id, { last_sync_at: new Date().toISOString() }).catch(() => {});
      await loadEmails();
    } catch (err) { console.error(err); }
    setSyncing(false);
  };

  const markAsRead = async (email) => {
    if (!email.is_read) {
      await base44.entities.EmailMessage.update(email.id, { is_read: true });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
    }
  };

  const toggleStar = async (e, email) => {
    e.stopPropagation();
    await base44.entities.EmailMessage.update(email.id, { is_starred: !email.is_starred });
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_starred: !e.is_starred } : e));
  };

  const startReply = (email) => {
    setReplyTo(email);
    setCompose({
      to: email.from_email,
      subject: email.subject?.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
      body: `\n\n---\nOn ${format(new Date(email.sent_at), "MMM d, yyyy")} ${email.from_name || email.from_email} wrote:\n${email.body_text?.substring(0, 500) || ""}`,
    });
    setComposing(true);
  };

  const sendEmail = async () => {
    if (!compose.to || !compose.body) return;
    setSending(true);
    try {
      const conn = gmailConnection;
      const token = conn.access_token;
      const mimeLines = [
        `To: ${compose.to}`,
        `Subject: ${compose.subject}`,
        `From: ${conn.user_email}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        compose.body,
      ];
      if (replyTo) mimeLines.splice(2, 0, `In-Reply-To: ${replyTo.gmail_message_id}`);
      const mimeMessage = mimeLines.join("\r\n");
      const encoded = btoa(unescape(encodeURIComponent(mimeMessage)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encoded }),
      });

      setComposing(false);
      setCompose({ to: "", subject: "", body: "" });
      setReplyTo(null);
      await loadEmails();
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const filteredEmails = emails.filter(e =>
    search === "" ||
    e.subject?.toLowerCase().includes(search.toLowerCase()) ||
    e.from_email?.toLowerCase().includes(search.toLowerCase()) ||
    e.from_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.snippet?.toLowerCase().includes(search.toLowerCase())
  );

  const folders = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: emails.filter(e => e.direction === "inbound" && !e.is_read).length },
    { id: "sent", label: "Sent", icon: Send, count: 0 },
    { id: "starred", label: "Starred", icon: Star, count: 0 },
  ];

  if (!gmailConnection) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connect your Gmail</h2>
          <p className="text-gray-500 mb-6">Connect your Gmail account to view and send emails directly from AmplifyCRM. All emails will be automatically linked to your contacts and deals.</p>
          <Button onClick={connectGmail} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Mail className="w-4 h-4" /> Connect Gmail Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-800">Email</h1>
          <Badge variant="outline" className="text-xs text-gray-500">{gmailConnection.user_email}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={syncEmails} disabled={syncing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
          <Button size="sm" onClick={() => { setComposing(true); setReplyTo(null); setCompose({ to: "", subject: "", body: "" }); }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" /> Compose
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 border-r bg-gray-50 py-4">
          {folders.map(f => (
            <button key={f.id} onClick={() => setFolder(f.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${folder === f.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"}`}>
              <div className="flex items-center gap-2"><f.icon className="w-4 h-4" />{f.label}</div>
              {f.count > 0 && <Badge className="bg-blue-600 text-white text-xs h-5 px-1.5">{f.count}</Badge>}
            </button>
          ))}
        </div>

        <div className="w-80 border-r flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search emails..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No emails yet</p>
                <Button variant="link" size="sm" onClick={syncEmails} className="text-blue-600 mt-1">Sync now</Button>
              </div>
            ) : filteredEmails.map(email => (
              <div key={email.id} onClick={() => { setSelectedEmail(email); markAsRead(email); }}
                className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedEmail?.id === email.id ? "bg-blue-50 border-l-2 border-l-blue-600" : ""} ${!email.is_read ? "bg-blue-50/30" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm truncate ${!email.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {email.direction === "outbound" ? `To: ${email.to_emails?.[0]}` : (email.from_name || email.from_email)}
                  </span>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button onClick={e => toggleStar(e, email)}>
                      <Star className={`w-3.5 h-3.5 ${email.is_starred ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-gray-400"}`} />
                    </button>
                    <span className="text-xs text-gray-400">{email.sent_at ? format(new Date(email.sent_at), "MMM d") : ""}</span>
                  </div>
                </div>
                <p className={`text-sm truncate ${!email.is_read ? "font-medium text-gray-800" : "text-gray-600"}`}>{email.subject || "(no subject)"}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{email.snippet}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedEmail ? (
            <>
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedEmail(null)} className="md:hidden text-gray-400 hover:text-gray-600">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-base font-semibold text-gray-900 truncate">{selectedEmail.subject || "(no subject)"}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startReply(selectedEmail)} className="gap-1.5 text-sm">
                    <Reply className="w-4 h-4" /> Reply
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
                    <Forward className="w-4 h-4" /> Forward
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
                        {(selectedEmail.from_name || selectedEmail.from_email || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{selectedEmail.from_name || selectedEmail.from_email}</p>
                        <p className="text-xs text-gray-500">{selectedEmail.from_email}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 pl-10">
                      To: {selectedEmail.to_emails?.join(", ")}
                      {selectedEmail.cc_emails?.length > 0 && ` · CC: ${selectedEmail.cc_emails.join(", ")}`}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {selectedEmail.sent_at ? format(new Date(selectedEmail.sent_at), "MMM d, yyyy 'at' h:mm a") : ""}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {selectedEmail.body_html ? (
                    <iframe srcDoc={selectedEmail.body_html} className="w-full min-h-96 border-0" sandbox="allow-same-origin" title="email-body" />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm">{selectedEmail.body_text}</pre>
                  )}
                </div>
              </div>
              <div className="border-t p-4">
                <div className="border rounded-lg p-3 cursor-text bg-gray-50 hover:bg-white hover:border-blue-300 transition-colors" onClick={() => startReply(selectedEmail)}>
                  <p className="text-sm text-gray-400">Reply to {selectedEmail.from_name || selectedEmail.from_email}...</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {composing && (
        <div className="fixed bottom-4 right-4 w-[480px] bg-white rounded-xl shadow-2xl border z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 rounded-t-xl">
            <span className="text-white text-sm font-medium">{replyTo ? `Reply to ${replyTo.from_name || replyTo.from_email}` : "New Message"}</span>
            <button onClick={() => { setComposing(false); setReplyTo(null); }}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
          </div>
          <div className="flex flex-col divide-y">
            <Input placeholder="To" value={compose.to} onChange={e => setCompose(p => ({ ...p, to: e.target.value }))} className="border-0 rounded-none px-4 h-10 text-sm focus-visible:ring-0" />
            <Input placeholder="Subject" value={compose.subject} onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))} className="border-0 rounded-none px-4 h-10 text-sm focus-visible:ring-0" />
            <Textarea placeholder="Write your message..." value={compose.body} onChange={e => setCompose(p => ({ ...p, body: e.target.value }))} className="border-0 rounded-none px-4 min-h-48 text-sm resize-none focus-visible:ring-0" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <Button onClick={sendEmail} disabled={sending || !compose.to || !compose.body} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Send className="w-4 h-4" />{sending ? "Sending..." : "Send"}
            </Button>
            <button onClick={() => { setComposing(false); setReplyTo(null); }} className="text-gray-400 hover:text-gray-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}