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
      sync_type: 'HubSpot Deals',
      sync_started_at: syncStartTime,
      sync_status: 'In Progress'
    });

    // HubSpot API properties to fetch
    const properties = [
      'dealname', 'amount', 'closedate', 'dealstage', 'pipeline', 
      'hs_priority', 'dealtype', 'description', 'createdate', 
      'hs_lastmodifieddate', 'hs_object_id'
    ].join(',');

    // Fetch all deals with pagination
    let allDeals = [];
    let hasMore = true;
    let after = null;

    while (hasMore) {
      const url = after 
        ? `https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=${properties}&after=${after}`
        : `https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=${properties}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Update sync log with failure
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
      allDeals = allDeals.concat(hubspotData.results || []);
      
      // Check if there are more pages
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

    // Get existing deals to check for duplicates
    const existingDeals = await base44.asServiceRole.entities.Deal.list();

    for (const hsDeal of allDeals) {
      try {
        const props = hsDeal.properties;
        
        // Map HubSpot fields to Base44 fields
        const dealData = {
          deal_name: props.dealname || '',
          deal_amount: parseFloat(props.amount) || 0,
          close_date: props.closedate || null,
          deal_stage: mapDealStage(props.dealstage),
          pipeline: props.pipeline || 'Sales Pipeline',
          probability: calculateProbability(props.dealstage),
          contact_id: '',
          company_id: '',
          deal_owner: user.email,
          deal_type: mapDealType(props.dealtype),
          priority: mapPriority(props.hs_priority),
          next_step: props.description || '',
          custom_data: {
            hubspot_id: hsDeal.id,
            hubspot_created_date: props.createdate,
            hubspot_modified_date: props.hs_lastmodifieddate,
            original_stage: props.dealstage
          }
        };

        // Check if deal already exists by HubSpot ID
        const existingDeal = existingDeals.find(d => 
          d.custom_data?.hubspot_id === hsDeal.id
        );

        if (existingDeal) {
          await base44.asServiceRole.entities.Deal.update(existingDeal.id, dealData);
          updatedCount++;
        } else {
          await base44.asServiceRole.entities.Deal.create(dealData);
          createdCount++;
        }

      } catch (error) {
        errorCount++;
        errors.push({
          deal: hsDeal.properties?.dealname || hsDeal.id,
          error: error.message
        });
      }
    }

    const syncCompleteTime = new Date().toISOString();
    const summary = {
      total_hubspot_deals: allDeals.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      fields_synced: 10
    };

    // Update sync log with success
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
    console.error('HubSpot deals sync error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to sync HubSpot deals' 
    }, { status: 500 });
  }
});

function mapDealStage(hsStage) {
  const stageMap = {
    'appointmentscheduled': 'Appointment Scheduled',
    'qualifiedtobuy': 'Qualified',
    'presentationscheduled': 'Presentation Scheduled',
    'decisionmakerboughtin': 'Decision Maker Bought-In',
    'contractsent': 'Contract Sent',
    'closedwon': 'Closed Won',
    'closedlost': 'Closed Lost'
  };
  return stageMap[hsStage?.toLowerCase().replace(/\s+/g, '')] || 'Appointment Scheduled';
}

function mapDealType(hsType) {
  const typeMap = {
    'newbusiness': 'New Business',
    'existingbusiness': 'Existing Business',
    'renewal': 'Renewal'
  };
  return typeMap[hsType?.toLowerCase().replace(/\s+/g, '')] || 'New Business';
}

function mapPriority(hsPriority) {
  const priorityMap = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High'
  };
  return priorityMap[hsPriority?.toLowerCase()] || 'Medium';
}

function calculateProbability(dealStage) {
  const probabilityMap = {
    'appointmentscheduled': 20,
    'qualifiedtobuy': 40,
    'presentationscheduled': 60,
    'decisionmakerboughtin': 80,
    'contractsent': 90,
    'closedwon': 100,
    'closedlost': 0
  };
  return probabilityMap[dealStage?.toLowerCase().replace(/\s+/g, '')] || 50;
}