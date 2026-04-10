import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function getValidToken(base44, userEmail) {
  const configs = await base44.asServiceRole.entities.RingCentral_Config.filter({ user_email: userEmail });
  const config = configs[0];
  if (!config) throw new Error('RingCentral not connected');

  const now = new Date();
  const expiresAt = new Date(config.expires_at);
  if (expiresAt - now > 5 * 60 * 1000) return { token: config.access_token, config };

  const clientId = Deno.env.get('RINGCENTRAL_CLIENT_ID');
  const clientSecret = Deno.env.get('RINGCENTRAL_CLIENT_SECRET');
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://platform.ringcentral.com/restapi/oauth/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: config.refresh_token })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Token refresh failed');
  const newToken = data.access_token;
  await base44.asServiceRole.entities.RingCentral_Config.update(config.id, {
    access_token: newToken,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  });
  return { token: newToken, config };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to_number, content, contact_id } = await req.json();
    if (!to_number || !content) return Response.json({ error: 'to_number and content required' }, { status: 400 });

    const { token, config } = await getValidToken(base44, user.email);

    const res = await fetch('https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~/sms', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { phoneNumber: config.extension_number || undefined },
        to: [{ phoneNumber: to_number }],
        text: content
      })
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.message || 'SMS failed' }, { status: 400 });

    // Store in RC_Message
    await base44.asServiceRole.entities.RC_Message.create({
      contact_id: contact_id || null,
      user_email: user.email,
      direction: 'outbound',
      content,
      from_number: config.extension_number || '',
      to_number,
      rc_message_id: data.id,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });

    return Response.json({ success: true, messageId: data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});