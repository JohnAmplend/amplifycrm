import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function toE164(number) {
  if (!number) return '';
  const digits = number.replace(/\D/g, '');
  if (number.startsWith('+')) return number;
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

async function getValidToken(base44, userEmail) {
  const configs = await base44.asServiceRole.entities.RingCentral_Config.filter({ user_email: userEmail });
  const config = configs[0];
  if (!config) throw new Error('RingCentral not connected for this user');
  if (!config.access_token) throw new Error('No access token — please reconnect RingCentral');

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

  await base44.asServiceRole.entities.RingCentral_Config.update(config.id, {
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
  });
  return { token: data.access_token, config: { ...config, access_token: data.access_token } };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { to_number, from_number, contact_id } = await req.json();
    if (!to_number) return Response.json({ success: false, error: 'to_number required' });

    const { token, config } = await getValidToken(base44, user.email);

    // Resolve from number: explicit override > stored extension_number > fetch live
    let fromRaw = from_number || config.extension_number || '';

    // If still empty, try fetching live from RingCentral
    if (!fromRaw) {
      const phoneRes = await fetch('https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~/phone-number', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const phoneData = phoneRes.ok ? await phoneRes.json() : {};
      const records = phoneData.records || [];
      const direct = records.find(p => p.usageType === 'DirectNumber' || p.type === 'VoiceFax');
      fromRaw = (direct || records[0])?.phoneNumber || '';

      // Persist it for future calls
      if (fromRaw && config.id) {
        await base44.asServiceRole.entities.RingCentral_Config.update(config.id, { extension_number: fromRaw });
      }
    }

    const fromNumber = toE164(fromRaw);
    const toNumber = toE164(to_number);

    console.log('makeCall from:', fromNumber, 'to:', toNumber);

    if (!fromNumber) {
      return Response.json({ success: false, error: 'No RingCentral phone number assigned to this user. Please check your RingCentral account has a DID number.' });
    }

    const payload = {
      from: { phoneNumber: fromNumber },
      to: { phoneNumber: toNumber },
      playPrompt: false
    };

    console.log('RingOut request payload:', JSON.stringify(payload));

    const res = await fetch('https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~/ring-out', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const rcStatus = res.status;
    const rcData = await res.json();
    console.log('RingCentral response status:', rcStatus, 'body:', JSON.stringify(rcData));

    if (!res.ok) {
      return Response.json({
        success: false,
        status: rcStatus,
        error: rcData.message || rcData.error_description || 'RingOut call failed',
        rc_error: rcData
      });
    }

    await base44.asServiceRole.entities.RingCentral_Call.create({
      call_id: rcData.id || `ringout-${Date.now()}`,
      direction: 'Outbound',
      to_number: toNumber,
      from_number: fromNumber,
      call_status: 'Completed',
      contact_id: contact_id || null,
      call_datetime: new Date().toISOString()
    });

    return Response.json({ success: true, call_id: rcData.id, status: rcData.status?.callStatus });
  } catch (error) {
    console.error('makeCall exception:', error.message);
    return Response.json({ success: false, error: error.message });
  }
});