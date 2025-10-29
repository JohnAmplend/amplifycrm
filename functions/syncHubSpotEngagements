import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  const syncStartTime = new Date().toISOString();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");
    if (!HUBSPOT_API_KEY) {
      return Response.json({ 
        error: 'HubSpot API key not configured' 
      }, { status: 400 });
    }

    // Create sync log entry
    const syncLog = await base44.asServiceRole.entities.Sync_Log.create({
      sync_type: 'HubSpot Engagements',
      sync_started_at: syncStartTime,
      sync_status: 'In Progress'
    });

    // HubSpot v3 engagement properties
    const properties = [
      'hs_timestamp', 'hs_call_title', 'hs_call_body', 'hs_call_duration',
      'hs_call_status', 'hs_call_direction', 'hs_call_recording_url',
      'hs_meeting_title', 'hs_meeting_body', 'hs_meeting_start_time',
      'hs_meeting_end_time', 'hs_email_subject', 'hs_email_text',
      'hs_note_body', 'hs_createdate', 'hs_lastmodifieddate', 'hs_object_id'
    ].join(',');

    let allEngagements = [];

    // Fetch calls
    try {
      let hasMore = true;
      let after = null;

      while (hasMore) {
        const url = after 
          ? `https://api.hubapi.com/crm/v3/objects/calls?limit=100&properties=${properties}&after=${after}`
          : `https://api.hubapi.com/crm/v3/objects/calls?limit=100&properties=${properties}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const calls = (data.results || []).map(call => ({ ...call, type: 'Call' }));
          allEngagements = allEngagements.concat(calls);
          
          if (data.paging?.next?.after) {
            after = data.paging.next.after;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
    }

    // Fetch meetings
    try {
      let hasMore = true;
      let after = null;

      while (hasMore) {
        const url = after 
          ? `https://api.hubapi.com/crm/v3/objects/meetings?limit=100&properties=${properties}&after=${after}`
          : `https://api.hubapi.com/crm/v3/objects/meetings?limit=100&properties=${properties}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const meetings = (data.results || []).map(meeting => ({ ...meeting, type: 'Meeting' }));
          allEngagements = allEngagements.concat(meetings);
          
          if (data.paging?.next?.after) {
            after = data.paging.next.after;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }

    // Fetch notes
    try {
      let hasMore = true;
      let after = null;

      while (hasMore) {
        const url = after 
          ? `https://api.hubapi.com/crm/v3/objects/notes?limit=100&properties=${properties}&after=${after}`
          : `https://api.hubapi.com/crm/v3/objects/notes?limit=100&properties=${properties}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const notes = (data.results || []).map(note => ({ ...note, type: 'Note' }));
          allEngagements = allEngagements.concat(notes);
          
          if (data.paging?.next?.after) {
            after = data.paging.next.after;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Get existing activities
    const existingActivities = await base44.asServiceRole.entities.Activity.list();

    for (const hsEngagement of allEngagements) {
      try {
        const props = hsEngagement.properties;
        
        const activityData = {
          activity_type: hsEngagement.type,
          subject: props.hs_call_title || props.hs_meeting_title || props.hs_email_subject || 'Activity',
          description: props.hs_call_body || props.hs_meeting_body || props.hs_note_body || props.hs_email_text || '',
          activity_date: props.hs_timestamp || props.hs_meeting_start_time || props.hs_createdate || null,
          duration_minutes: props.hs_call_duration ? Math.round(props.hs_call_duration / 60000) : null,
          status: 'Completed',
          custom_data: {
            hubspot_id: hsEngagement.id,
            hubspot_type: hsEngagement.type,
            hubspot_created: props.hs_createdate,
            hubspot_modified: props.hs_lastmodifieddate,
            call_status: props.hs_call_status,
            call_direction: props.hs_call_direction,
            recording_url: props.hs_call_recording_url
          }
        };

        const existingActivity = existingActivities.find(a => 
          a.custom_data?.hubspot_id === hsEngagement.id
        );

        if (existingActivity) {
          await base44.asServiceRole.entities.Activity.update(existingActivity.id, activityData);
          updatedCount++;
        } else {
          await base44.asServiceRole.entities.Activity.create(activityData);
          createdCount++;
        }

      } catch (error) {
        errorCount++;
        errors.push({
          engagement: hsEngagement.id,
          error: error.message
        });
      }
    }

    const syncCompleteTime = new Date().toISOString();
    const summary = {
      total_hubspot_engagements: allEngagements.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      fields_synced: 8
    };

    await base44.asServiceRole.entities.Sync_Log.update(syncLog.id, {
      sync_status: errorCount > 0 ? 'Partial' : 'Completed',
      sync_completed_at: syncCompleteTime,
      records_synced: createdCount + updatedCount,
      records_created: createdCount,
      records_updated: updatedCount,
      records_failed: errorCount,
      sync_summary: summary,
      error_details: errors.length > 0 ? JSON.stringify(errors) : null
    });

    return Response.json({
      success: true,
      summary,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('HubSpot engagements sync error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to sync HubSpot engagements' 
    }, { status: 500 });
  }
});