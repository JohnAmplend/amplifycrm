import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { google } from 'npm:googleapis@129.0.0';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Google is connected
    if (!user.google_connected || !user.google_refresh_token) {
      return Response.json({ 
        error: 'Google Calendar not connected',
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
      refresh_token: user.google_refresh_token,
      access_token: user.google_access_token,
      expiry_date: user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : null
    });

    // Refresh token if needed
    const now = new Date().getTime();
    const expiryDate = user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : 0;
    
    if (!user.google_access_token || expiryDate - now < 5 * 60 * 1000) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await base44.asServiceRole.auth.updateMe({
        google_access_token: credentials.access_token,
        google_token_expiry: new Date(credentials.expiry_date).toISOString()
      });
      oauth2Client.setCredentials(credentials);
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = user.google_calendar_id || 'primary';

    // Fetch events (30 days ago to 90 days in future)
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 90);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250
    });

    const events = response.data.items || [];
    
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const sampleItems = [];
    const errors = [];

    // Process each event
    for (const event of events) {
      try {
        // Skip events without start time
        if (!event.start || (!event.start.dateTime && !event.start.date)) {
          continue;
        }

        // Parse start and end times
        let startAt, endAt, allDay = false;
        
        if (event.start.date) {
          // All-day event
          allDay = true;
          startAt = new Date(event.start.date + 'T00:00:00Z').toISOString();
          endAt = event.end?.date 
            ? new Date(event.end.date + 'T00:00:00Z').toISOString()
            : startAt;
        } else {
          // Timed event
          startAt = new Date(event.start.dateTime).toISOString();
          endAt = event.end?.dateTime 
            ? new Date(event.end.dateTime).toISOString()
            : startAt;
        }

        // Calculate duration
        const durationMinutes = Math.round(
          (new Date(endAt).getTime() - new Date(startAt).getTime()) / (1000 * 60)
        );

        const activityData = {
          subject: event.summary || '(No title)',
          description: event.description || '',
          activity_type: 'Meeting',
          activity_date: startAt,
          end_date: endAt,
          all_day: allDay,
          duration_minutes: durationMinutes,
          assigned_to: user.email,
          status: event.status === 'cancelled' ? 'Cancelled' : 'Scheduled',
          google_event_id: event.id,
          google_calendar_id: calendarId,
          google_etag: event.etag,
          google_last_synced_at: new Date().toISOString(),
          google_source: 'google',
          sync_error: null
        };

        // Check if activity already exists
        const existing = await base44.asServiceRole.entities.Activity.filter({
          google_event_id: event.id,
          assigned_to: user.email
        });

        if (existing.length > 0) {
          // Update existing
          await base44.asServiceRole.entities.Activity.update(existing[0].id, activityData);
          updatedCount++;
        } else {
          // Create new
          await base44.asServiceRole.entities.Activity.create(activityData);
          createdCount++;
        }

        // Add to sample items (first 3)
        if (sampleItems.length < 3) {
          sampleItems.push({
            title: activityData.subject,
            start: startAt,
            google_event_id: event.id,
            all_day: allDay
          });
        }

      } catch (eventError) {
        errorCount++;
        errors.push({
          event_id: event.id,
          error: eventError.message
        });
        
        // Try to log error in activity if it exists
        try {
          const existing = await base44.asServiceRole.entities.Activity.filter({
            google_event_id: event.id,
            assigned_to: user.email
          });
          if (existing.length > 0) {
            await base44.asServiceRole.entities.Activity.update(existing[0].id, {
              sync_error: eventError.message
            });
          }
        } catch {}
      }
    }

    const totalProcessed = createdCount + updatedCount;
    const duration = Date.now() - startTime;

    // Log sync result
    await base44.asServiceRole.entities.Calendar_Sync_Log.create({
      user_email: user.email,
      sync_type: 'pull_from_google',
      status: errorCount > 0 ? 'partial' : 'success',
      created_count: createdCount,
      updated_count: updatedCount,
      error_count: errorCount,
      total_processed: totalProcessed,
      error_details: errors.length > 0 ? JSON.stringify(errors) : null,
      sample_items: sampleItems,
      duration_ms: duration
    });

    return Response.json({
      success: true,
      created: createdCount,
      updated: updatedCount,
      total: totalProcessed,
      errors: errorCount,
      sample_items: sampleItems,
      duration_ms: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('pullGoogleEvents error:', error);
    
    // Log error
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      if (user) {
        await base44.asServiceRole.entities.Calendar_Sync_Log.create({
          user_email: user.email,
          sync_type: 'pull_from_google',
          status: 'error',
          error_details: error.message,
          duration_ms: duration
        });
      }
    } catch {}

    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});