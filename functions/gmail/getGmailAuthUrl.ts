Deno.serve(async (req) => {
  try {
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const REDIRECT_URI = "https://crm.amplend.net/auth/google/gmail/callback";

    if (!GOOGLE_CLIENT_ID) {
      return Response.json({ error: 'Google OAuth not configured' }, { status: 400 });
    }

    // Generate random state for CSRF protection
    const state = crypto.randomUUID();

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