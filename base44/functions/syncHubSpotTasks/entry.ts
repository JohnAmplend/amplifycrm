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
      sync_type: 'HubSpot Tasks',
      sync_started_at: syncStartTime,
      sync_status: 'In Progress'
    });

    // HubSpot API properties to fetch
    const properties = [
      'hs_task_subject', 'hs_task_body', 'hs_task_status', 'hs_task_priority',
      'hs_timestamp', 'hs_task_type', 'hs_createdate', 'hs_lastmodifieddate',
      'hs_object_id'
    ].join(',');

    // Fetch all tasks with pagination
    let allTasks = [];
    let hasMore = true;
    let after = null;

    while (hasMore) {
      const url = after 
        ? `https://api.hubapi.com/crm/v3/objects/tasks?limit=100&properties=${properties}&after=${after}`
        : `https://api.hubapi.com/crm/v3/objects/tasks?limit=100&properties=${properties}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        await base44.asServiceRole.entities.Sync_Log.update(syncLog.id, {
          sync_status: 'Failed',
          sync_completed_at: new Date().toISOString(),
          error_details: `Failed to fetch from HubSpot: ${errorText}`
        });
        
        return Response.json({ 
          error: 'Failed to fetch from HubSpot', 
          details: errorText,
          status: response.status
        }, { status: response.status });
      }

      const hubspotData = await response.json();
      allTasks = allTasks.concat(hubspotData.results || []);
      
      if (hubspotData.paging?.next?.after) {
        after = hubspotData.paging.next.after;
      } else {
        hasMore = false;
      }
    }

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Get existing tasks
    const existingTasks = await base44.asServiceRole.entities.Task.list();

    for (const hsTask of allTasks) {
      try {
        const props = hsTask.properties;
        
        const taskData = {
          task_name: props.hs_task_subject || '',
          description: props.hs_task_body || '',
          due_date: props.hs_timestamp || null,
          priority: mapPriority(props.hs_task_priority),
          status: mapTaskStatus(props.hs_task_status),
          assigned_to: user.email,
          custom_data: {
            hubspot_id: hsTask.id,
            hubspot_created_date: props.hs_createdate,
            hubspot_modified_date: props.hs_lastmodifieddate,
            hubspot_task_type: props.hs_task_type
          }
        };

        const existingTask = existingTasks.find(t => 
          t.custom_data?.hubspot_id === hsTask.id
        );

        if (existingTask) {
          await base44.asServiceRole.entities.Task.update(existingTask.id, taskData);
          updatedCount++;
        } else {
          await base44.asServiceRole.entities.Task.create(taskData);
          createdCount++;
        }

      } catch (error) {
        errorCount++;
        errors.push({
          task: hsTask.properties?.hs_task_subject || hsTask.id,
          error: error.message
        });
      }
    }

    const syncCompleteTime = new Date().toISOString();
    const summary = {
      total_hubspot_tasks: allTasks.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      fields_synced: 7
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
    console.error('HubSpot tasks sync error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to sync HubSpot tasks' 
    }, { status: 500 });
  }
});

function mapTaskStatus(hsStatus) {
  const statusMap = {
    'NOT_STARTED': 'Not Started',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'WAITING': 'Deferred',
    'DEFERRED': 'Deferred'
  };
  return statusMap[hsStatus?.toUpperCase()] || 'Not Started';
}

function mapPriority(hsPriority) {
  const priorityMap = {
    'LOW': 'Low',
    'MEDIUM': 'Medium',
    'HIGH': 'High'
  };
  return priorityMap[hsPriority?.toUpperCase()] || 'Medium';
}