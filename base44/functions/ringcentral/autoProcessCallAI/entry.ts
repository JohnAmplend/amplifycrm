import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// This function is triggered by an entity automation when recording_url is set on a RingCentral_Call
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;
    if (!data?.recording_url) {
      return Response.json({ skipped: 'no recording_url' });
    }

    // Only process if not already done
    if (data.transcript_status === 'completed' || data.transcript_status === 'processing') {
      return Response.json({ skipped: 'already processed or processing' });
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) return Response.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });

    // Mark as processing immediately so we don't double-process
    await base44.asServiceRole.entities.RingCentral_Call.update(data.id, { transcript_status: 'processing' });

    // Async: fire-and-forget the AI processing via function invoke
    // We call processCallAI with service role so no user auth needed
    base44.asServiceRole.functions.invoke('ringcentral/processCallAI', { call_id: data.call_id })
      .catch(e => console.error('Auto AI process error:', e.message));

    return Response.json({ success: true, call_id: data.call_id, message: 'AI processing queued' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});