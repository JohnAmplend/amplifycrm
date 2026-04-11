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

    const { to_number, content, contact_id } = await req.json();
    if (!to_number || !content) return Response.json({ success: false, error: 'to_number and content required' });

    const { token, config } = await getValidToken(base44, user.email);

    const fromNumber = toE164(config.extension_number || '');
    const toNumber = toE164(to_number);

    if (!fromNumber) return Response.json({ success: false, error: 'No from number — check your RingCentral extension_number in config' });

    const payload = {
      from: { phoneNumber: fromNumber },
      to: [{ phoneNumber: toNumber }],
      text: content
    };

    console.log('SMS request payload:', JSON.stringify(payload));

    const res = await fetch('https://platform.ringcentral.com/restapi/v1.0/account/~/extension/~/sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const rcStatus = res.status;
    const rcData = await res.json();
    console.log('RingCentral SMS response status:', rcStatus);
    console.log('RingCentral SMS response body:', JSON.stringify(rcData));

    if (!res.ok) {
      return Response.json({
        success: false,
        status: rcStatus,
        error: rcData.message || rcData.error_description || 'SMS send failed',
        rc_error: rcData
      });
    }

    await base44.asServiceRole.entities.RC_Message.create({
      contact_id: contact_id || null,
      user_email: user.email,
      direction: 'outbound',
      content,
      from_number: fromNumber,
      to_number: toNumber,
      rc_message_id: rcData.id,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });

    return Response.json({ success: true, messageId: rcData.id });
  } catch (error) {
    console.error('sendSMS exception:', error.message);
    return Response.json({ success: false, error: error.message });
  }
});