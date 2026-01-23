import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const code = body.code;

    if (!code) {
      return Response.json({ 
        error: 'No authorization code provided' 
      }, { status: 400 });
    }

    // Get OAuth credentials from environment
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      return Response.json({ 
        error: 'Google OAuth credentials not configured' 
      }, { status: 500 });
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
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return Response.json({ 
        error: 'Failed to exchange authorization code for tokens',
        details: errorData
      }, { status: 400 });
    }

    const tokens = await tokenResponse.json();
    
    const {
      access_token,
      refresh_token,
      expires_in,
      token_type,
      scope
    } = tokens;

    if (!access_token || !refresh_token) {
      return Response.json({ 
        error: 'Invalid token response from Google' 
      }, { status: 400 });
    }

    // Calculate token expiry time
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in);

    // Get user's primary calendar ID
    let calendarId = 'primary';
    try {
      const calendarResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        const primaryCal = calendarData.items?.find(cal => cal.primary);
        if (primaryCal) {
          calendarId = primaryCal.id;
        }
      }
    } catch (e) {
      console.warn('Could not fetch calendar list, using "primary":', e);
    }

    // Update user with connection details
    await base44.auth.updateMe({
      google_connected: true,
      google_access_token: access_token,
      google_refresh_token: refresh_token,
      google_token_expiry: tokenExpiry.toISOString(),
      google_calendar_id: calendarId,
      google_token_type: token_type,
      google_scope: scope
    });

    return Response.json({
      success: true,
      message: 'Google Calendar connected successfully',
      calendar_id: calendarId
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.json({ 
      error: 'Failed to complete OAuth flow',
      details: error.message 
    }, { status: 500 });
  }
});