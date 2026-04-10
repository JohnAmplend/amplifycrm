import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

export async function getValidToken(base44, userEmail) {
  const configs = await base44.asServiceRole.entities.RingCentral_Config.filter({ user_email: userEmail });
  const config = configs[0];
  if (!config) throw new Error('RingCentral not connected for this user');

  const now = new Date();
  const expiresAt = new Date(config.expires_at);
  const bufferMs = 5 * 60 * 1000; // 5 min buffer

  if (expiresAt - now > bufferMs) return config.access_token;

  // Refresh the token
  const clientId = Deno.env.get('RINGCENTRAL_CLIENT_ID');
  const clientSecret = Deno.env.get('RINGCENTRAL_CLIENT_SECRET');
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://platform.ringcentral.com/restapi/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: config.refresh_token
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Token refresh failed');

  const expiresAtNew = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await base44.asServiceRole.entities.RingCentral_Config.update(config.id, {
    access_token: data.access_token,
    refresh_token: data.refresh_token || config.refresh_token,
    expires_at: expiresAtNew
  });

  return data.access_token;
}

// Also expose as standalone function for testing
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const token = await getValidToken(base44, user.email);
    return Response.json({ success: true, token: token.substring(0, 10) + '...' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});