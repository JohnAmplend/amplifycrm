import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactIds } = await req.json();
    
    // Fetch contacts
    const contacts = contactIds 
      ? await Promise.all(contactIds.map(id => base44.asServiceRole.entities.Contact.get(id)))
      : await base44.asServiceRole.entities.Contact.list();

    // Fetch activities for engagement scoring
    const allActivities = await base44.asServiceRole.entities.Activity.list();
    
    const scoredContacts = [];

    for (const contact of contacts) {
      // Build contact analysis prompt
      const contactActivities = allActivities.filter(a => a.contact_id === contact.id);
      
      const analysisPrompt = `Analyze this lead and assign a score from 0-100 based on their conversion likelihood.

Contact Information:
- Name: ${contact.first_name} ${contact.last_name}
- Email: ${contact.email || 'N/A'}
- Job Title: ${contact.job_title || 'N/A'}
- Company: ${contact.company_id || 'N/A'}
- Industry: ${contact.industry || 'N/A'}
- Annual Revenue: ${contact.annual_revenue ? '$' + contact.annual_revenue.toLocaleString() : 'N/A'}
- Lifecycle Stage: ${contact.lifecycle_stage || 'N/A'}
- Lead Status: ${contact.lead_status || 'N/A'}
- Lead Source: ${contact.lead_source || 'N/A'}

Engagement Metrics:
- Emails Opened: ${contact.marketing_emails_opened || 0}
- Emails Clicked: ${contact.marketing_emails_clicked || 0}
- Recent Activities: ${contactActivities.length}
- Last Contacted: ${contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : 'Never'}

Deal Information:
- Deal Amount: ${contact.deal_amount ? '$' + contact.deal_amount.toLocaleString() : 'N/A'}
- Deal Stage: ${contact.deal_stage_name || 'N/A'}

Scoring Criteria:
- Demographics (0-25 pts): Job title relevance, company size, industry fit
- Engagement (0-30 pts): Email interactions, activity frequency, recency
- Intent (0-25 pts): Deal presence, lifecycle stage progression
- Fit (0-20 pts): Company revenue, location, source quality

Return ONLY a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation of score>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"]
}`;

      // Call AI for scoring
      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            reasoning: { type: "string" },
            key_factors: { 
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      const score = Math.min(100, Math.max(0, aiResponse.score));
      
      // Determine grade based on score
      let grade;
      if (score >= 75) grade = 'Sales Ready';
      else if (score >= 50) grade = 'Hot';
      else if (score >= 25) grade = 'Warm';
      else grade = 'Cold';

      // Update contact with score
      await base44.asServiceRole.entities.Contact.update(contact.id, {
        lead_score: score,
        lead_score_grade: grade,
        lead_score_last_updated: new Date().toISOString(),
        custom_data: {
          ...contact.custom_data,
          lead_score_reasoning: aiResponse.reasoning,
          lead_score_factors: aiResponse.key_factors
        }
      });

      scoredContacts.push({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        previous_score: contact.lead_score || 0,
        new_score: score,
        grade: grade,
        reasoning: aiResponse.reasoning,
        key_factors: aiResponse.key_factors
      });
    }

    return Response.json({
      success: true,
      total_scored: scoredContacts.length,
      contacts: scoredContacts
    });

  } catch (error) {
    console.error('Lead scoring error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});