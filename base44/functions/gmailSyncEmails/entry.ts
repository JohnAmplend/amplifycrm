import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return Response.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    const { conn_id } = await req.json().catch(() => ({}));

    // Get the user's Gmail connection
    const connections = await base44.entities.GmailAccount.filter({ user_email: user.email });
    const conn = conn_id
      ? connections.find(c => c.id === conn_id)
      : connections[0];

    if (!conn) return Response.json({ error: 'No Gmail connection found' }, { status: 404 });

    // Refresh token if needed
    let token = conn.access_token;
    const tokenExpiry = new Date(conn.expires_at);
    if (tokenExpiry < new Date(Date.now() + 60000)) {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: conn.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });
      const tokens = await tokenRes.json();
      if (tokens.error) {
        return Response.json({ error: `Token refresh failed: ${tokens.error}` }, { status: 401 });
      }
      token = tokens.access_token;
      await base44.entities.GmailAccount.update(conn.id, {
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });
    }

    // Fetch inbox and sent messages
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

    let totalSynced = 0;
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
      totalSynced++;
    }

    await base44.entities.GmailAccount.update(conn.id, { last_sync_at: new Date().toISOString() });

    return Response.json({ success: true, synced: totalSynced });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});