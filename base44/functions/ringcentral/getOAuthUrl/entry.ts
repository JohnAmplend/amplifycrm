import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get('RINGCENTRAL_CLIENT_ID');
    if (!clientId) return Response.json({ error: 'RINGCENTRAL_CLIENT_ID not configured' }, { status: 500 });

    const redirectUri = 'https://crm.amplend.net/RingCentralOAuthCallback';
    const scopes = 'ReadCallLog SMS RingOut ReadCallRecording';
    const authUrl = `https://platform.ringcentral.com/restapi/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

    return Response.json({ auth_url: authUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});