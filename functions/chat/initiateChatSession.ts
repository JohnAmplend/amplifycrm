import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { website_url, visitor_id, visitor_name, visitor_email } = await req.json();

    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create chat session
    const session = await base44.asServiceRole.entities.ChatSession.create({
      session_id: sessionId,
      website_url,
      visitor_id,
      visitor_name,
      visitor_email,
      status: 'Open',
      start_time: now,
      last_activity_time: now
    });

    // Try to link to existing contact if email provided
    let contact = null;
    if (visitor_email) {
      const contacts = await base44.asServiceRole.entities.Contact.filter({ 
        email: visitor_email 
      });
      
      if (contacts.length > 0) {
        contact = contacts[0];
        await base44.asServiceRole.entities.ChatSession.update(session.id, {
          contact_id: contact.id
        });
      }
    }

    // Send system welcome message
    await base44.asServiceRole.entities.ChatMessage.create({
      session_id: sessionId,
      sender_type: 'System',
      sender_id: 'system',
      sender_name: 'System',
      message_content: 'Welcome! How can we help you today?',
      is_read: false
    });

    return Response.json({ 
      success: true, 
      session_id: sessionId,
      contact_id: contact?.id || null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});