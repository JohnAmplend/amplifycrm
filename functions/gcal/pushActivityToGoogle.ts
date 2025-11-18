import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { google } from 'npm:googleapis@129.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activity_id } = await req.json();

    if (!activity_id) {
      return Response.json({ error: 'activity_id is required' }, { status: 400 });
    }

    // Get the activity
    const activities = await base44.asServiceRole.entities.Activity.filter({ id: activity_id });
    
    if (activities.length === 0) {
      return Response.json({ error: 'Activity not found' }, { status: 404 });
    }

    const activity = activities[0];

    // Get the assigned user
    const assignedUser = activity.assigned_to 
      ? await base44.asServiceRole.entities.User.filter({ email: activity.assigned_to })
      : [];

    const targetUser = assignedUser.length > 0 ? assignedUser[0] : user;

    // Check if user has Google connected
    if (!targetUser.google_connected || !targetUser.google_refresh_token) {
      return Response.json({ 
        error: 'Google Calendar not connected for assigned user',
        needs_connection: true 
      }, { status: 400 });
    }

    // Set up OAuth client
    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      Deno.env.get('GOOGLE_REDIRECT_URI')
    );

    oauth2Client.setCredentials({
      refresh_token: targetUser.google_refresh_token,
      access_token: targetUser.google_access_token,
      expiry_date: targetUser.google_token_expiry ? new Date(targetUser.google_token_expiry).getTime() : null
    });

    // Refresh token if needed
    const now = new Date().getTime();
    const expiryDate = targetUser.google_token_expiry ? new Date(targetUser.google_token_expiry).getTime() : 0;
    
    if (!targetUser.google_access_token || expiryDate - now < 5 * 60 * 1000) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = targetUser.google_calendar_id || 'primary';

    // Prepare event data
    const eventData = {
      summary: activity.subject,
      description: activity.description || '',
      status: activity.status === 'Cancelled' ? 'cancelled' : 'confirmed'
    };

    // Handle dates
    if (activity.all_day) {
      // All-day event - use date format
      const startDate = new Date(activity.activity_date).toISOString().split('T')[0];
      const endDate = activity.end_date 
        ? new Date(activity.end_date).toISOString().split('T')[0]
        : startDate;
      
      eventData.start = { date: startDate };
      eventData.end = { date: endDate };
    } else {
      // Timed event - use dateTime format
      eventData.start = { 
        dateTime: new Date(activity.activity_date).toISOString(),
        timeZone: 'UTC'
      };
      eventData.end = {
        dateTime: activity.end_date 
          ? new Date(activity.end_date).toISOString()
          : new Date(activity.activity_date).toISOString(),
        timeZone: 'UTC'
      };
    }

    let googleEvent;

    if (activity.google_event_id) {
      // Update existing event
      googleEvent = await calendar.events.update({
        calendarId: calendarId,
        eventId: activity.google_event_id,
        requestBody: eventData
      });
    } else {
      // Create new event
      googleEvent = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: eventData
      });
    }

    // Update activity with Google data
    await base44.asServiceRole.entities.Activity.update(activity.id, {
      google_event_id: googleEvent.data.id,
      google_calendar_id: calendarId,
      google_etag: googleEvent.data.etag,
      google_last_synced_at: new Date().toISOString(),
      google_source: activity.google_source || 'crm',
      sync_error: null
    });

    return Response.json({
      success: true,
      action: activity.google_event_id ? 'updated' : 'created',
      google_event_id: googleEvent.data.id,
      activity_id: activity.id
    });

  } catch (error) {
    console.error('pushActivityToGoogle error:', error);
    
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});