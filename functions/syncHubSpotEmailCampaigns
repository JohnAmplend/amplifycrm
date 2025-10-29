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
      sync_type: 'HubSpot Email Campaigns',
      sync_started_at: syncStartTime,
      sync_status: 'In Progress'
    });

    // Fetch all marketing emails with pagination
    let allCampaigns = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const url = `https://api.hubapi.com/marketing/v3/emails?limit=${limit}&offset=${offset}`;

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
      const campaigns = hubspotData.objects || [];
      allCampaigns = allCampaigns.concat(campaigns);
      
      if (campaigns.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Get existing campaigns
    const existingCampaigns = await base44.asServiceRole.entities.Email_Campaign.list();

    for (const hsCampaign of allCampaigns) {
      try {
        const campaignData = {
          campaign_name: hsCampaign.name || '',
          subject_line: hsCampaign.subject || '',
          email_body: hsCampaign.emailBody || '',
          from_name: hsCampaign.fromName || '',
          from_email: hsCampaign.fromEmail || '',
          reply_to_email: hsCampaign.replyTo || '',
          campaign_type: 'One-Time Blast',
          status: mapCampaignStatus(hsCampaign.state),
          send_date: hsCampaign.publishDate || null,
          total_recipients: hsCampaign.statistics?.counters?.sent || 0,
          total_sent: hsCampaign.statistics?.counters?.sent || 0,
          total_delivered: hsCampaign.statistics?.counters?.delivered || 0,
          total_opened: hsCampaign.statistics?.counters?.open || 0,
          total_clicked: hsCampaign.statistics?.counters?.click || 0,
          total_bounced: hsCampaign.statistics?.counters?.bounce || 0,
          total_unsubscribed: hsCampaign.statistics?.counters?.unsubscribed || 0,
          custom_data: {
            hubspot_id: hsCampaign.id,
            hubspot_created: hsCampaign.created,
            hubspot_updated: hsCampaign.updated
          }
        };

        const existingCampaign = existingCampaigns.find(c => 
          c.custom_data?.hubspot_id === hsCampaign.id
        );

        if (existingCampaign) {
          await base44.asServiceRole.entities.Email_Campaign.update(existingCampaign.id, campaignData);
          updatedCount++;
        } else {
          await base44.asServiceRole.entities.Email_Campaign.create(campaignData);
          createdCount++;
        }

      } catch (error) {
        errorCount++;
        errors.push({
          campaign: hsCampaign.name || hsCampaign.id,
          error: error.message
        });
      }
    }

    const syncCompleteTime = new Date().toISOString();
    const summary = {
      total_hubspot_campaigns: allCampaigns.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      fields_synced: 15
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
    console.error('HubSpot email campaigns sync error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to sync HubSpot email campaigns' 
    }, { status: 500 });
  }
});

function mapCampaignStatus(hsState) {
  const statusMap = {
    'DRAFT': 'Draft',
    'SCHEDULED': 'Scheduled',
    'SENDING': 'Sending',
    'PUBLISHED': 'Sent',
    'PUBLISHED_OR_SCHEDULED': 'Scheduled'
  };
  return statusMap[hsState?.toUpperCase()] || 'Draft';
}