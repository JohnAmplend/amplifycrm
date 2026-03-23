import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, subject, body, replyToMessageId } = await req.json();
    if (!to || !body) return Response.json({ error: 'Missing required fields' }, { status: 400 });

    // Get the user's Gmail connection
    const connections = await base44.entities.GmailAccount.filter({ user_email: user.email });
    if (!connections.length) return Response.json({ error: 'No Gmail connection found' }, { status: 404 });
    const conn = connections[0];

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

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
      if (tokens.error) return Response.json({ error: `Token refresh failed: ${tokens.error}` }, { status: 401 });
      token = tokens.access_token;
      await base44.entities.GmailAccount.update(conn.id, {
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });
    }

    const mimeLines = [
      `To: ${to}`,
      `Subject: ${subject || ""}`,
      `From: ${conn.user_email}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      body,
    ];
    if (replyToMessageId) mimeLines.splice(2, 0, `In-Reply-To: ${replyToMessageId}`);

    const mimeMessage = mimeLines.join("\r\n");
    // Use TextEncoder for proper UTF-8 encoding
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(mimeMessage)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!sendRes.ok) {
      const err = await sendRes.json();
      return Response.json({ error: err.error?.message || 'Send failed' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});