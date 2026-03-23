import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id, updates } = await req.json();

    if (!session_id) {
      return Response.json({ error: 'session_id required' }, { status: 400 });
    }

    const sessions = await base44.asServiceRole.entities.ChatSession.filter({ session_id });
    
    if (sessions.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const updated = await base44.asServiceRole.entities.ChatSession.update(
      sessions[0].id, 
      updates
    );

    return Response.json({ success: true, session: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});