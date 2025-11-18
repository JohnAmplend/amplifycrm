import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { google } from 'npm:googleapis@129.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Google is connected
    if (!user.google_connected || !user.google_refresh_token) {
      return Response.json({ 
        error: 'Google Calendar not connected for this user',
        needs_connection: true 
      }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      Deno.env.get('GOOGLE_REDIRECT_URI')
    );

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: user.google_refresh_token,
      access_token: user.google_access_token,
      expiry_date: user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : null
    });

    // Check if token needs refresh
    const now = new Date().getTime();
    const expiryDate = user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : 0;
    
    if (!user.google_access_token || expiryDate - now < 5 * 60 * 1000) {
      // Token expired or will expire in 5 minutes - refresh it
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update user with new tokens
      await base44.asServiceRole.auth.updateMe({
        google_access_token: credentials.access_token,
        google_token_expiry: new Date(credentials.expiry_date).toISOString()
      });

      oauth2Client.setCredentials(credentials);
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = user.google_calendar_id || 'primary';

    return Response.json({
      success: true,
      calendar_id: calendarId,
      user_email: user.email
    });

  } catch (error) {
    console.error('getGoogleClient error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});