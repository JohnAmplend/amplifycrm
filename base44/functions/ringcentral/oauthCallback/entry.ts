import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, redirect_uri } = await req.json();
    if (!code) return Response.json({ error: 'Missing code' }, { status: 400 });

    const clientId = Deno.env.get('RINGCENTRAL_CLIENT_ID');
    const clientSecret = Deno.env.get('RINGCENTRAL_CLIENT_SECRET');
    const credentials = btoa(`${clientId}:${clientSecret}`);

    // Exchange code for tokens
    const tokenRes = await fetch('https://platform.ringcentral.com/restapi/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return Response.json({ error: tokenData.error_description || 'Token exchange failed' }, { status: 400 });

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Fetch extension info
    const extRes = await fetch('https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const extData = extRes.ok ? await extRes.json() : {};

    const configData = {
      user_email: user.email,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      ringcentral_account_id: extData.account?.id || '~',
      extension_id: extData.id || '~',
      extension_number: extData.contact?.businessPhone || extData.extensionNumber || '',
      display_name: extData.name || extData.contact?.firstName || '',
      is_connected: true,
      last_synced_at: new Date().toISOString()
    };

    // Upsert config
    const existing = await base44.asServiceRole.entities.RingCentral_Config.filter({ user_email: user.email });
    if (existing[0]) {
      await base44.asServiceRole.entities.RingCentral_Config.update(existing[0].id, configData);
    } else {
      await base44.asServiceRole.entities.RingCentral_Config.create(configData);
    }

    return Response.json({ success: true, display_name: configData.display_name, extension_number: configData.extension_number });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});