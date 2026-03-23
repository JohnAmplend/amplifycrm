import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.google_connected || !user.google_refresh_token) {
      return Response.json({ 
        error: 'Google Calendar not connected',
        needs_connection: true 
      }, { status: 400 });
    }

    const results = {
      from_google: { created: 0, updated: 0, total: 0 },
      from_crm: { created: 0, updated: 0, total: 0 }
    };

    // 1. Pull from Google
    try {
      const pullResponse = await base44.functions.invoke('gcal/pullGoogleEvents', {});
      
      if (pullResponse.data.success) {
        results.from_google = {
          created: pullResponse.data.created || 0,
          updated: pullResponse.data.updated || 0,
          total: pullResponse.data.total || 0
        };
      }
    } catch (pullError) {
      console.error('Pull from Google failed:', pullError);
    }

    // 2. Push CRM activities to Google
    try {
      const pushResponse = await base44.functions.invoke('calendarSync/bulkPushActivities', {});
      
      if (pushResponse.data.success) {
        results.from_crm = {
          created: pushResponse.data.created || 0,
          updated: pushResponse.data.updated || 0,
          total: pushResponse.data.total || 0
        };
      }
    } catch (pushError) {
      console.error('Push to Google failed:', pushError);
    }

    const duration = Date.now() - startTime;

    // Log full sync
    await base44.asServiceRole.entities.Calendar_Sync_Log.create({
      user_email: user.email,
      sync_type: 'full_sync',
      status: 'success',
      created_count: results.from_google.created + results.from_crm.created,
      updated_count: results.from_google.updated + results.from_crm.updated,
      total_processed: results.from_google.total + results.from_crm.total,
      duration_ms: duration
    });

    return Response.json({
      success: true,
      from_google: results.from_google,
      from_crm: results.from_crm,
      duration_ms: duration
    });

  } catch (error) {
    console.error('fullSyncForUser error:', error);
    
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});