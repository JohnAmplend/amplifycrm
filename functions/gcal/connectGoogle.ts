import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { google } from 'npm:googleapis@129.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      // Generate auth URL
      const oauth2Client = new google.auth.OAuth2(
        Deno.env.get('GOOGLE_CLIENT_ID'),
        Deno.env.get('GOOGLE_CLIENT_SECRET'),
        Deno.env.get('GOOGLE_REDIRECT_URI')
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        prompt: 'consent'
      });

      return Response.json({ auth_url: authUrl });
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      Deno.env.get('GOOGLE_REDIRECT_URI')
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Update user with tokens
    await base44.asServiceRole.auth.updateMe({
      google_connected: true,
      google_refresh_token: tokens.refresh_token,
      google_access_token: tokens.access_token,
      google_token_expiry: new Date(tokens.expiry_date).toISOString(),
      google_calendar_id: 'primary'
    });

    return Response.json({ 
      success: true,
      message: 'Google Calendar connected successfully'
    });

  } catch (error) {
    console.error('connectGoogle error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});