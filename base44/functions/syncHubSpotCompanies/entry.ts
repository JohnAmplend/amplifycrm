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
      sync_type: 'HubSpot Companies',
      sync_started_at: syncStartTime,
      sync_status: 'In Progress'
    });

    // HubSpot API properties to fetch
    const properties = [
      'name', 'domain', 'industry', 'phone', 'address', 'city', 'state', 
      'zip', 'country', 'numberofemployees', 'annualrevenue', 'lifecyclestage',
      'createdate', 'hs_lastmodifieddate', 'hs_object_id'
    ].join(',');

    // Fetch all companies with pagination
    let allCompanies = [];
    let hasMore = true;
    let after = null;

    while (hasMore) {
      const url = after 
        ? `https://api.hubapi.com/crm/v3/objects/companies?limit=100&properties=${properties}&after=${after}`
        : `https://api.hubapi.com/crm/v3/objects/companies?limit=100&properties=${properties}`;

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
      allCompanies = allCompanies.concat(hubspotData.results || []);
      
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

    // Get existing companies to check for duplicates
    const existingCompanies = await base44.asServiceRole.entities.Company.list();

    for (const hsCompany of allCompanies) {
      try {
        const props = hsCompany.properties;
        
        // Map HubSpot fields to Base44 fields
        const companyData = {
          company_name: props.name || '',
          domain: props.domain || '',
          industry: props.industry || '',
          phone: props.phone || '',
          address: props.address || '',
          city: props.city || '',
          state: props.state || '',
          zip: props.zip || '',
          country: props.country || '',
          number_of_employees: parseInt(props.numberofemployees) || null,
          annual_revenue: parseFloat(props.annualrevenue) || null,
          company_owner: user.email,
          lifecycle_stage: mapCompanyLifecycleStage(props.lifecyclestage),
          tags: [],
          last_activity_date: null,
          custom_data: {
            hubspot_id: hsCompany.id,
            hubspot_created_date: props.createdate,
            hubspot_modified_date: props.hs_lastmodifieddate
          }
        };

        // Check if company already exists by domain or HubSpot ID
        const existingCompany = existingCompanies.find(c => 
          (c.domain && c.domain === companyData.domain) || 
          c.custom_data?.hubspot_id === hsCompany.id
        );

        if (existingCompany) {
          await base44.asServiceRole.entities.Company.update(existingCompany.id, companyData);
          updatedCount++;
        } else {
          await base44.asServiceRole.entities.Company.create(companyData);
          createdCount++;
        }

      } catch (error) {
        errorCount++;
        errors.push({
          company: hsCompany.properties?.name || hsCompany.id,
          error: error.message
        });
      }
    }

    const syncCompleteTime = new Date().toISOString();
    const summary = {
      total_hubspot_companies: allCompanies.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      fields_synced: 13
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
    console.error('HubSpot companies sync error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to sync HubSpot companies' 
    }, { status: 500 });
  }
});

function mapCompanyLifecycleStage(hsStage) {
  const stageMap = {
    'lead': 'Lead',
    'opportunity': 'Opportunity',
    'customer': 'Customer',
    'evangelist': 'Evangelist',
    'other': 'Lead'
  };
  return stageMap[hsStage?.toLowerCase()] || 'Lead';
}