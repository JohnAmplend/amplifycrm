import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      return Response.json({ error: 'Google OAuth not configured' }, { status: 500 });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return Response.json({ 
        error: 'Failed to exchange code for tokens',
        details: errorData 
      }, { status: 400 });
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, scope, token_type } = tokens;

    if (!access_token || !refresh_token) {
      return Response.json({ error: 'Invalid token response from Google' }, { status: 400 });
    }

    // Calculate token expiry
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

    // Fetch user's primary calendar ID
    let calendarId = 'primary';
    try {
      const calendarResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        }
      );

      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        calendarId = calendarData.id || 'primary';
      }
    } catch (error) {
      console.error('Failed to fetch calendar ID, using default:', error);
    }

    // Update user with Google connection details
    await base44.auth.updateMe({
      google_connected: true,
      google_access_token: access_token,
      google_refresh_token: refresh_token,
      google_token_expiry: expiryDate.toISOString(),
      google_calendar_id: calendarId,
    });

    return Response.json({
      success: true,
      message: 'Google Calendar connected successfully',
      calendar_id: calendarId,
      expires_in: expires_in,
      scope: scope
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, { status: 500 });
  }
});