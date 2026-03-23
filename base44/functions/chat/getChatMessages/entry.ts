import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { session_id } = await req.json();

    if (!session_id) {
      return Response.json({ error: 'session_id required' }, { status: 400 });
    }

    const messages = await base44.asServiceRole.entities.ChatMessage.filter({ 
      session_id 
    }, 'created_date');

    return Response.json({ success: true, messages });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});