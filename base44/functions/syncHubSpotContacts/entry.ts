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
      sync_type: 'HubSpot Contacts',
      sync_started_at: syncStartTime,
      sync_status: 'In Progress'
    });

    // HubSpot API properties to fetch
    const properties = [
      'firstname', 'lastname', 'email', 'phone', 'mobilephone', 'jobtitle', 'company',
      'lifecyclestage', 'hs_lead_status', 'address', 'city', 'state', 'zip', 'country',
      'website', 'linkedinbio', 'twitterhandle', 'facebook', 'createdate', 'lastmodifieddate',
      'hs_object_id', 'industry', 'numemployees', 'annualrevenue', 'domain', 'hs_timezone',
      'hs_lead_source', 'hs_analytics_source', 'hs_latest_source', 'first_conversion_date',
      'recent_conversion_date', 'hs_email_open', 'hs_email_click', 'notes_last_contacted',
      'next_activity_date', 'closedate', 'amount', 'dealstage'
    ].join(',');

    // Fetch all contacts with pagination
    let allContacts = [];
    let hasMore = true;
    let after = null;

    while (hasMore) {
      const url = after 
        ? `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=${properties}&after=${after}`
        : `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=${properties}`;

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
      allContacts = allContacts.concat(hubspotData.results || []);
      
      // Check if there are more pages
      if (hubspotData.paging?.next?.after) {
        after = hubspotData.paging.next.after;
      } else {
        hasMore = false;
      }
    }

    let contactsCreated = 0;
    let contactsUpdated = 0;
    let leadsCreated = 0;
    let leadsUpdated = 0;
    let errorCount = 0;
    const errors = [];

    // Get existing contacts and leads to check for duplicates
    const existingContacts = await base44.asServiceRole.entities.Contact.list();
    const existingLeads = await base44.asServiceRole.entities.Lead.list();

    for (const hsContact of allContacts) {
      try {
        const props = hsContact.properties;
        const lifecycleStage = mapLifecycleStage(props.lifecyclestage);
        
        // Determine if this should be a Lead or Contact
        const isLead = lifecycleStage === 'Lead' || props.lifecyclestage?.toLowerCase() === 'lead';

        if (isLead) {
          // Create/Update as Lead
          const leadData = {
            first_name: props.firstname || '',
            last_name: props.lastname || '',
            email: props.email || '',
            phone: props.phone || '',
            company_name: props.company || '',
            job_title: props.jobtitle || '',
            lead_source: props.hs_lead_source || 'Website',
            lead_status: mapLeadStatus(props.hs_lead_status),
            lead_score: 0,
            lead_owner: user.email,
            custom_data: {
              hubspot_id: hsContact.id,
              hubspot_created_date: props.createdate,
              hubspot_modified_date: props.lastmodifieddate,
              hubspot_lifecycle_stage: props.lifecyclestage,
              original_source: props.hs_analytics_source,
              latest_source: props.hs_latest_source
            }
          };

          const existingLead = existingLeads.find(l => 
            l.email === leadData.email || 
            l.custom_data?.hubspot_id === hsContact.id
          );

          if (existingLead) {
            await base44.asServiceRole.entities.Lead.update(existingLead.id, leadData);
            leadsUpdated++;
          } else {
            await base44.asServiceRole.entities.Lead.create(leadData);
            leadsCreated++;
          }

        } else {
          // Create/Update as Contact
          const contactData = {
            first_name: props.firstname || '',
            last_name: props.lastname || '',
            email: props.email || '',
            phone: props.phone || '',
            mobile: props.mobilephone || '',
            job_title: props.jobtitle || '',
            company_id: '',
            contact_owner: user.email,
            lifecycle_stage: lifecycleStage,
            lead_status: mapLeadStatus(props.hs_lead_status),
            address: props.address || '',
            city: props.city || '',
            state: props.state || '',
            zip: props.zip || '',
            country: props.country || '',
            linkedin_url: props.linkedinbio || '',
            twitter_handle: props.twitterhandle || '',
            facebook_url: props.facebook || '',
            time_zone: props.hs_timezone || '',
            
            // Marketing & Source
            lead_source: props.hs_lead_source || '',
            original_source: props.hs_analytics_source || '',
            latest_source: props.hs_latest_source || '',
            first_conversion_date: props.first_conversion_date || null,
            recent_conversion_date: props.recent_conversion_date || null,
            
            // Engagement
            marketing_emails_opened: parseInt(props.hs_email_open) || 0,
            marketing_emails_clicked: parseInt(props.hs_email_click) || 0,
            last_contacted: props.notes_last_contacted || null,
            next_activity_date: props.next_activity_date || null,
            
            // Company Info
            industry: props.industry || '',
            number_of_employees: parseInt(props.numemployees) || null,
            annual_revenue: parseFloat(props.annualrevenue) || null,
            company_website: props.website || '',
            company_domain: props.domain || '',
            
            // Sales
            close_date: props.closedate || null,
            deal_amount: parseFloat(props.amount) || null,
            deal_stage_name: props.dealstage || '',
            
            custom_data: {
              hubspot_id: hsContact.id,
              hubspot_created_date: props.createdate,
              hubspot_modified_date: props.lastmodifieddate,
              hubspot_company_name: props.company
            }
          };

          const existingContact = existingContacts.find(c => 
            c.email === contactData.email || 
            c.custom_data?.hubspot_id === hsContact.id
          );

          if (existingContact) {
            await base44.asServiceRole.entities.Contact.update(existingContact.id, contactData);
            contactsUpdated++;
          } else {
            await base44.asServiceRole.entities.Contact.create(contactData);
            contactsCreated++;
          }
        }

      } catch (error) {
        errorCount++;
        errors.push({
          contact: hsContact.properties?.email || hsContact.id,
          error: error.message
        });
      }
    }

    const syncCompleteTime = new Date().toISOString();
    const summary = {
      total_hubspot_contacts: allContacts.length,
      contacts_created: contactsCreated,
      contacts_updated: contactsUpdated,
      leads_created: leadsCreated,
      leads_updated: leadsUpdated,
      total_created: contactsCreated + leadsCreated,
      total_updated: contactsUpdated + leadsUpdated,
      errors: errorCount,
      fields_synced: 37
    };

    // Update sync log with success
    await base44.asServiceRole.entities.Sync_Log.update(syncLog.id, {
      sync_status: errorCount > 0 ? 'Partial' : 'Completed',
      sync_completed_at: syncCompleteTime,
      records_synced: contactsCreated + contactsUpdated + leadsCreated + leadsUpdated,
      records_created: contactsCreated + leadsCreated,
      records_updated: contactsUpdated + leadsUpdated,
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
    console.error('HubSpot sync error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to sync HubSpot contacts' 
    }, { status: 500 });
  }
});

function mapLifecycleStage(hsStage) {
  const stageMap = {
    'subscriber': 'Subscriber',
    'lead': 'Lead',
    'marketingqualifiedlead': 'MQL',
    'salesqualifiedlead': 'SQL',
    'opportunity': 'Opportunity',
    'customer': 'Customer',
    'evangelist': 'Customer',
    'other': 'Lead'
  };
  return stageMap[hsStage?.toLowerCase()] || 'Lead';
}

function mapLeadStatus(hsStatus) {
  const statusMap = {
    'new': 'New',
    'open': 'Attempting',
    'in progress': 'Attempting',
    'open deal': 'Connected',
    'unqualified': 'Unqualified',
    'attempted to contact': 'Attempting',
    'connected': 'Connected',
    'bad timing': 'Unqualified',
    'attempting contact': 'Attempting Contact',
    'qualified': 'Qualified'
  };
  return statusMap[hsStatus?.toLowerCase()] || 'New';
}