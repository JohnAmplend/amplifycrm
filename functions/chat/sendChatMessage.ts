import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { session_id, sender_type, sender_id, sender_name, message_content } = await req.json();

    if (!session_id || !sender_type || !message_content) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the message
    const message = await base44.asServiceRole.entities.ChatMessage.create({
      session_id,
      sender_type,
      sender_id,
      sender_name,
      message_content,
      is_read: false
    });

    // Update session's last activity time
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.ChatSession.filter({ session_id }).then(sessions => {
      if (sessions.length > 0) {
        return base44.asServiceRole.entities.ChatSession.update(sessions[0].id, {
          last_activity_time: now,
          status: sender_type === 'Agent' ? 'Assigned' : sessions[0].status
        });
      }
    });

    return Response.json({ success: true, message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});