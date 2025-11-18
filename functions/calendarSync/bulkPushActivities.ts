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

    // Find all unsynced activities for this user
    const activities = await base44.asServiceRole.entities.Activity.list();
    
    const unsyncedActivities = activities.filter(a => 
      a.assigned_to === user.email &&
      !a.google_event_id &&
      !a.deleted_at &&
      a.activity_date
    );

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Push each activity
    for (const activity of unsyncedActivities) {
      try {
        const response = await base44.functions.invoke('gcal/pushActivityToGoogle', {
          activity_id: activity.id
        });

        if (response.data.success) {
          if (response.data.action === 'created') {
            createdCount++;
          } else {
            updatedCount++;
          }
        }
      } catch (error) {
        errorCount++;
        errors.push({
          activity_id: activity.id,
          error: error.message
        });
      }
    }

    const totalProcessed = createdCount + updatedCount;
    const duration = Date.now() - startTime;

    // Log bulk push
    await base44.asServiceRole.entities.Calendar_Sync_Log.create({
      user_email: user.email,
      sync_type: 'push_to_google',
      status: errorCount > 0 ? 'partial' : 'success',
      created_count: createdCount,
      updated_count: updatedCount,
      error_count: errorCount,
      total_processed: totalProcessed,
      error_details: errors.length > 0 ? JSON.stringify(errors) : null,
      duration_ms: duration
    });

    return Response.json({
      success: true,
      created: createdCount,
      updated: updatedCount,
      total: totalProcessed,
      errors: errorCount,
      duration_ms: duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('bulkPushActivities error:', error);
    
    try {
      const base44 = createClientFromRequest(req);
      const user = await base44.auth.me();
      if (user) {
        await base44.asServiceRole.entities.Calendar_Sync_Log.create({
          user_email: user.email,
          sync_type: 'push_to_google',
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