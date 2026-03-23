import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contact_id, email, company_name } = await req.json();

    if (!contact_id) {
      return Response.json({ error: 'contact_id required' }, { status: 400 });
    }

    // Fetch the contact
    const contacts = await base44.asServiceRole.entities.Contact.filter({ id: contact_id });
    const contact = contacts[0];

    if (!contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Use AI to enrich contact data
    const enrichmentPrompt = `Enrich this contact profile with professional data:

Email: ${email || contact.email}
Company: ${company_name || contact.company_id || 'Unknown'}
Current Data: ${JSON.stringify({
  job_title: contact.job_title,
  linkedin_url: contact.linkedin_url
})}

Based on the email domain and available information, provide enriched professional data:

1. Job Title & Seniority (if not present or generic)
2. Industry (based on email domain or company)
3. Company Size estimate (Small: 1-50, Medium: 51-500, Large: 500+)
4. Estimated Company Revenue Range
5. LinkedIn profile URL (professional format)
6. Twitter handle (if inferable from name/company)
7. Phone verification status (Valid/Invalid/Unknown)
8. Professional email verification (Corporate/Personal/Unknown)

Provide realistic, professional enrichment based on patterns and best practices.

Format as JSON with:
{
  "job_title": "estimated job title",
  "seniority": "Entry/Mid/Senior/Executive",
  "industry": "estimated industry",
  "company_size": "Small/Medium/Large",
  "estimated_revenue": "$X-Y million",
  "linkedin_url": "https://linkedin.com/in/...",
  "twitter_handle": "@handle",
  "phone_status": "Valid/Invalid/Unknown",
  "email_type": "Corporate/Personal/Unknown",
  "confidence_score": 0-100,
  "enrichment_notes": "brief explanation of enrichment"
}`;

    const enrichedData = await base44.integrations.Core.InvokeLLM({
      prompt: enrichmentPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          job_title: { type: "string" },
          seniority: { type: "string" },
          industry: { type: "string" },
          company_size: { type: "string" },
          estimated_revenue: { type: "string" },
          linkedin_url: { type: "string" },
          twitter_handle: { type: "string" },
          phone_status: { type: "string" },
          email_type: { type: "string" },
          confidence_score: { type: "number" },
          enrichment_notes: { type: "string" }
        }
      }
    });

    // Update contact with enriched data (only if not already present)
    const updates = {};
    
    if (!contact.job_title && enrichedData.job_title) {
      updates.job_title = enrichedData.job_title;
    }
    
    if (!contact.industry && enrichedData.industry) {
      updates.industry = enrichedData.industry;
    }
    
    if (!contact.linkedin_url && enrichedData.linkedin_url) {
      updates.linkedin_url = enrichedData.linkedin_url;
    }
    
    if (!contact.twitter_handle && enrichedData.twitter_handle) {
      updates.twitter_handle = enrichedData.twitter_handle;
    }

    // Store enrichment metadata in custom_data
    updates.custom_data = {
      ...contact.custom_data,
      enrichment: {
        enriched_at: new Date().toISOString(),
        enriched_by: 'AI Data Enrichment',
        confidence_score: enrichedData.confidence_score,
        seniority: enrichedData.seniority,
        company_size: enrichedData.company_size,
        estimated_revenue: enrichedData.estimated_revenue,
        phone_status: enrichedData.phone_status,
        email_type: enrichedData.email_type,
        notes: enrichedData.enrichment_notes
      }
    };

    // Update the contact
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Contact.update(contact_id, updates);
    }

    // Log enrichment activity
    try {
      const enrichmentLogs = await base44.asServiceRole.entities.Custom_Objects.filter({ 
        object_name: 'Data_Enrichment_Log' 
      });
      
      if (enrichmentLogs[0]) {
        await base44.asServiceRole.entities.Custom_Object_Records.create({
          object_id: enrichmentLogs[0].id,
          record_name: `Enrichment: ${contact.first_name} ${contact.last_name}`,
          record_data: {
            contact_id,
            enriched_at: new Date().toISOString(),
            fields_enriched: Object.keys(updates).filter(k => k !== 'custom_data'),
            confidence_score: enrichedData.confidence_score,
            source: 'AI Enrichment'
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log enrichment:', logError);
    }

    return Response.json({
      success: true,
      enriched_fields: Object.keys(updates).filter(k => k !== 'custom_data'),
      enrichment_data: enrichedData,
      updated_contact: { ...contact, ...updates }
    });

  } catch (error) {
    console.error('Contact enrichment error:', error);
    return Response.json({ 
      error: error.message || 'Failed to enrich contact data' 
    }, { status: 500 });
  }
});