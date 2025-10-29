import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
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

    const counts = {};

    // Helper function to get count from HubSpot
    const getCount = async (objectType) => {
      try {
        const url = `https://api.hubapi.com/crm/v3/objects/${objectType}?limit=1`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return data.total || 0;
        }
        return 0;
      } catch (error) {
        console.error(`Error fetching ${objectType} count:`, error);
        return 0;
      }
    };

    // Get special count for forms (different API)
    const getFormsCount = async () => {
      try {
        const response = await fetch('https://api.hubapi.com/forms/v2/forms', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return data.length || 0;
        }
        return 0;
      } catch (error) {
        console.error('Error fetching forms count:', error);
        return 0;
      }
    };

    // Get special count for email campaigns (different API)
    const getCampaignsCount = async () => {
      try {
        const response = await fetch('https://api.hubapi.com/marketing/v3/emails?limit=1', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return data.total || 0;
        }
        return 0;
      } catch (error) {
        console.error('Error fetching campaigns count:', error);
        return 0;
      }
    };

    // Fetch all counts in parallel
    const [
      contactsCount,
      companiesCount,
      dealsCount,
      ticketsCount,
      campaignsCount,
      formsCount,
      callsCount,
      meetingsCount,
      notesCount,
      tasksCount
    ] = await Promise.all([
      getCount('contacts'),
      getCount('companies'),
      getCount('deals'),
      getCount('tickets'),
      getCampaignsCount(),
      getFormsCount(),
      getCount('calls'),
      getCount('meetings'),
      getCount('notes'),
      getCount('tasks')
    ]);

    return Response.json({
      success: true,
      counts: {
        contacts: contactsCount,
        companies: companiesCount,
        deals: dealsCount,
        tickets: ticketsCount,
        campaigns: campaignsCount,
        forms: formsCount,
        engagements: callsCount + meetingsCount + notesCount,
        calls: callsCount,
        meetings: meetingsCount,
        notes: notesCount,
        tasks: tasksCount,
        total: contactsCount + companiesCount + dealsCount + ticketsCount + campaignsCount + formsCount + callsCount + meetingsCount + notesCount + tasksCount
      }
    });

  } catch (error) {
    console.error('Get HubSpot counts error:', error);
    
    return Response.json({ 
      error: error.message || 'Failed to get HubSpot counts' 
    }, { status: 500 });
  }
});