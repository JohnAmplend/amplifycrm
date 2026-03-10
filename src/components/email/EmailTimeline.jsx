import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, ChevronDown, ChevronUp, Reply } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function EmailTimeline({ contact_id, company_id, deal_id, lead_id, onReply }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { loadEmails(); }, [contact_id, company_id, deal_id, lead_id]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      let allEmails = [];
      if (contact_id) allEmails.push(...await base44.entities.EmailMessage.filter({ contact_id }));
      if (company_id) allEmails.push(...await base44.entities.EmailMessage.filter({ company_id }));
      if (deal_id) allEmails.push(...await base44.entities.EmailMessage.filter({ deal_id }));
      if (lead_id) allEmails.push(...await base44.entities.EmailMessage.filter({ lead_id }));

      const seen = new Set();
      allEmails = allEmails.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
      allEmails.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
      setEmails(allEmails);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return (
    <div className="py-6 flex justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
    </div>
  );

  if (emails.length === 0) return (
    <div className="py-8 text-center text-gray-400">
      <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">No emails yet</p>
      <p className="text-xs mt-1">Emails will appear here once synced from Gmail</p>
    </div>
  );

  const threads = {};
  emails.forEach(email => {
    const threadId = email.gmail_thread_id || email.id;
    if (!threads[threadId]) threads[threadId] = [];
    threads[threadId].push(email);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{emails.length} email{emails.length !== 1 ? "s" : ""}</span>
      </div>
      {Object.values(threads).map(threadEmails => {
        const latest = threadEmails[0];
        const threadId = latest.gmail_thread_id || latest.id;
        const isExpanded = expanded[threadId];
        const hasMultiple = threadEmails.length > 1;
        return (
          <div key={threadId} className="border rounded-lg overflow-hidden bg-white hover:border-blue-200 transition-colors">
            <div className="px-4 py-3 cursor-pointer" onClick={() => toggleExpand(threadId)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${latest.direction === "outbound" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                    {(latest.from_name || latest.from_email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${!latest.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                        {latest.direction === "outbound" ? `You → ${latest.to_emails?.[0]}` : (latest.from_name || latest.from_email)}
                      </span>
                      <Badge variant="outline" className={`text-xs py-0 ${latest.direction === "outbound" ? "border-blue-200 text-blue-600" : "border-gray-200 text-gray-500"}`}>
                        {latest.direction === "outbound" ? "Sent" : "Received"}
                      </Badge>
                      {hasMultiple && <Badge variant="secondary" className="text-xs py-0">{threadEmails.length}</Badge>}
                      {!latest.is_read && <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                    </div>
                    <p className={`text-sm truncate ${!latest.is_read ? "font-medium text-gray-800" : "text-gray-600"}`}>{latest.subject || "(no subject)"}</p>
                    {!isExpanded && <p className="text-xs text-gray-400 truncate mt-0.5">{latest.snippet}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{latest.sent_at ? format(new Date(latest.sent_at), "MMM d") : ""}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
            </div>
            {isExpanded && (
              <div className="border-t">
                {threadEmails.map((email, idx) => (
                  <div key={email.id} className={`px-4 py-3 ${idx < threadEmails.length - 1 ? "border-b" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">{email.direction === "outbound" ? "You" : (email.from_name || email.from_email)}</span>
                        <span className="text-xs text-gray-400">→ {email.to_emails?.join(", ")}</span>
                      </div>
                      <span className="text-xs text-gray-400">{email.sent_at ? format(new Date(email.sent_at), "MMM d, h:mm a") : ""}</span>
                    </div>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded p-3">
                      {email.body_html ? (
                        <iframe srcDoc={email.body_html} className="w-full min-h-32 border-0" sandbox="allow-same-origin" title={`email-${email.id}`} />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm">{email.body_text?.substring(0, 1000)}{email.body_text?.length > 1000 ? "..." : ""}</pre>
                      )}
                    </div>
                    {onReply && idx === threadEmails.length - 1 && (
                      <div className="mt-2 flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => onReply(email)} className="gap-1.5 text-xs text-gray-500 hover:text-blue-600">
                          <Reply className="w-3.5 h-3.5" /> Reply
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}