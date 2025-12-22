import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const REDIRECT_URI = "https://crm.amplend.net/auth/google/gmail/callback";

    if (!GOOGLE_CLIENT_ID) {
      return Response.json({ error: 'Google OAuth not configured' }, { status: 400 });
    }

    // Generate random state tied to user
    const state = crypto.randomUUID() + '|' + user.email;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return Response.json({ 
      auth_url: authUrl,
      state: state 
    });

  } catch (error) {
    console.error('Get Gmail auth URL error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});