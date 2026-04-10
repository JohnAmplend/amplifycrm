import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function getValidToken(base44, userEmail) {
  const configs = await base44.asServiceRole.entities.RingCentral_Config.filter({ user_email: userEmail });
  const config = configs[0];
  if (!config) throw new Error('RingCentral not connected');

  const now = new Date();
  const expiresAt = new Date(config.expires_at);
  if (expiresAt - now > 5 * 60 * 1000) return config.access_token;

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
  await base44.asServiceRole.entities.RingCentral_Config.update(config.id, {
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  });
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to_number, from_number, contact_id } = await req.json();
    if (!to_number) return Response.json({ error: 'to_number required' }, { status: 400 });

    const token = await getValidToken(base44, user.email);

    const res = await fetch('https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~/ring-out', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { phoneNumber: from_number || undefined },
        to: { phoneNumber: to_number },
        playPrompt: false
      })
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.message || 'Call failed' }, { status: 400 });

    // Log the call attempt
    await base44.asServiceRole.entities.RingCentral_Call.create({
      call_id: data.id || `ringout-${Date.now()}`,
      direction: 'Outbound',
      to_number,
      from_number: from_number || '',
      call_status: 'Completed',
      contact_id: contact_id || null,
      call_datetime: new Date().toISOString()
    });

    return Response.json({ success: true, callId: data.id, status: data.status?.callStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});