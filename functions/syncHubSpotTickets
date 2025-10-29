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
      sync_type: 'HubSpot Tickets',
      sync_started_at: syncStartTime,
      sync_status: 'In Progress'
    });

    // HubSpot API properties to fetch
    const properties = [
      'subject', 'content', 'hs_ticket_priority', 'hs_pipeline_stage',
      'hs_ticket_category', 'source_type', 'createdate', 'hs_lastmodifieddate',
      'closed_date', 'first_agent_reply_date', 'hs_object_id'
    ].join(',');

    // Fetch all tickets with pagination
    let allTickets = [];
    let hasMore = true;
    let after = null;

    while (hasMore) {
      const url = after 
        ? `https://api.hubapi.com/crm/v3/objects/tickets?limit=100&properties=${properties}&after=${after}`
        : `https://api.hubapi.com/crm/v3/objects/tickets?limit=100&properties=${properties}`;

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
      allTickets = allTickets.concat(hubspotData.results || []);
      
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

    // Get existing tickets
    const existingTickets = await base44.asServiceRole.entities.Ticket.list();

    for (const hsTicket of allTickets) {
      try {
        const props = hsTicket.properties;
        
        const ticketData = {
          ticket_number: `HS-${hsTicket.id}`,
          subject: props.subject || '',
          description: props.content || '',
          status: mapTicketStatus(props.hs_pipeline_stage),
          priority: mapPriority(props.hs_ticket_priority),
          ticket_type: props.hs_ticket_category || 'Question',
          category: 'General',
          source: mapSource(props.source_type),
          assigned_to: user.email,
          first_response_date: props.first_agent_reply_date || null,
          closed_date: props.closed_date || null,
          custom_data: {
            hubspot_id: hsTicket.id,
            hubspot_created_date: props.createdate,
            hubspot_modified_date: props.hs_lastmodifieddate
          }
        };

        const existingTicket = existingTickets.find(t => 
          t.custom_data?.hubspot_id === hsTicket.id
        );

        if (existingTicket) {
          await base44.asServiceRole.entities.Ticket.update(existingTicket.id, ticketData);
          updatedCount++;
        } else {
          await base44.asServiceRole.entities.Ticket.create(ticketData);
          createdCount++;
        }

      } catch (error) {
        errorCount++;
        errors.push({
          ticket: hsTicket.properties?.subject || hsTicket.id,
          error: error.message
        });
      }
    }

    const syncCompleteTime = new Date().toISOString();
    const summary = {
      total_hubspot_tickets: allTickets.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      fields_synced: 11
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
    console.error('HubSpot tickets sync error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to sync HubSpot tickets' 
    }, { status: 500 });
  }
});

function mapTicketStatus(hsStage) {
  const statusMap = {
    '1': 'New',
    '2': 'In Progress',
    '3': 'Waiting on Customer',
    '4': 'Closed'
  };
  return statusMap[hsStage] || 'New';
}

function mapPriority(hsPriority) {
  const priorityMap = {
    'LOW': 'Low',
    'MEDIUM': 'Medium',
    'HIGH': 'High',
    'URGENT': 'Urgent'
  };
  return priorityMap[hsPriority?.toUpperCase()] || 'Medium';
}

function mapSource(hsSource) {
  const sourceMap = {
    'EMAIL': 'Email',
    'FORM': 'Form',
    'PHONE': 'Phone',
    'CHAT': 'Chat'
  };
  return sourceMap[hsSource?.toUpperCase()] || 'Manual';
}