import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log('oauthCallback for user:', user.id, user.email);

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
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri })
    });

    const tokenData = await tokenRes.json();
    console.log('Token exchange status:', tokenRes.status);
    if (!tokenRes.ok) return Response.json({ error: tokenData.error_description || 'Token exchange failed' }, { status: 400 });

    const accessToken = tokenData.access_token;
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Fetch extension info
    const extRes = await fetch('https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const extData = extRes.ok ? await extRes.json() : {};
    console.log('Extension data:', JSON.stringify(extData));

    // Fetch DID phone numbers
    const phoneRes = await fetch('https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~/phone-number', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const phoneData = phoneRes.ok ? await phoneRes.json() : {};
    const phoneRecords = phoneData.records || [];
    console.log('Phone records:', JSON.stringify(phoneRecords));

    const directNumber = phoneRecords.find(p => p.usageType === 'DirectNumber' || p.type === 'VoiceFax');
    const resolvedPhoneNumber = (directNumber || phoneRecords[0])?.phoneNumber ||
      extData.contact?.businessPhone || extData.extensionNumber || '';

    console.log('Resolved extension_number:', resolvedPhoneNumber);

    const configData = {
      user_id: user.id,
      user_email: user.email,
      access_token: accessToken,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      ringcentral_account_id: extData.account?.id || '~',
      extension_id: String(extData.id || '~'),
      extension_number: resolvedPhoneNumber,
      display_name: extData.name || extData.contact?.firstName || '',
      is_connected: true,
      last_synced_at: new Date().toISOString()
    };

    // Upsert by user_email
    const existing = await base44.asServiceRole.entities.RingCentral_Config.filter({ user_email: user.email });
    if (existing[0]) {
      await base44.asServiceRole.entities.RingCentral_Config.update(existing[0].id, configData);
      console.log('Updated existing config id:', existing[0].id);
    } else {
      const created = await base44.asServiceRole.entities.RingCentral_Config.create(configData);
      console.log('Created new config id:', created.id);
    }

    return Response.json({ success: true, display_name: configData.display_name, extension_number: configData.extension_number });
  } catch (error) {
    console.error('oauthCallback error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});