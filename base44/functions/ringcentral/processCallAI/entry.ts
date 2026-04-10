import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Helper: transcribe audio via OpenAI Whisper
async function transcribeAudio(recordingUrl, openaiKey) {
  // Download the audio file
  const audioRes = await fetch(recordingUrl);
  if (!audioRes.ok) throw new Error(`Failed to download recording: ${audioRes.status}`);
  const audioBlob = await audioRes.arrayBuffer();

  // Build multipart form
  const formData = new FormData();
  formData.append('file', new Blob([audioBlob], { type: 'audio/mpeg' }), 'recording.mp3');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'text');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}` },
    body: formData
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper error: ${err}`);
  }
  return await res.text();
}

// Helper: generate AI summary via OpenAI
async function generateSummary(transcript, openaiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are a CRM assistant. Analyze this sales/support call transcript and return a JSON object with these fields:
- summary: A concise 2-3 sentence paragraph summarizing what was discussed
- key_points: A newline-separated list of 3-5 key points (each starting with "• ")
- sentiment: One word, exactly one of: positive, neutral, negative
- action_items: A newline-separated list of follow-up action items (each starting with "• "), or "None identified" if none

Return ONLY valid JSON, no markdown.

Transcript:
${transcript.substring(0, 8000)}`
      }],
      temperature: 0.3
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content.trim();
  return JSON.parse(content);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { call_id } = await req.json();
    if (!call_id) return Response.json({ error: 'call_id required' }, { status: 400 });

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) return Response.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });

    // Find the call record
    const calls = await base44.asServiceRole.entities.RingCentral_Call.filter({ call_id });
    const call = calls[0];
    if (!call) return Response.json({ error: 'Call not found' }, { status: 404 });
    if (!call.recording_url) return Response.json({ error: 'No recording_url on this call' }, { status: 400 });

    // Mark as processing
    await base44.asServiceRole.entities.RingCentral_Call.update(call.id, { transcript_status: 'processing' });

    // Step 1: Transcribe
    let transcript;
    try {
      transcript = await transcribeAudio(call.recording_url, openaiKey);
    } catch (e) {
      await base44.asServiceRole.entities.RingCentral_Call.update(call.id, { transcript_status: 'failed' });
      return Response.json({ error: `Transcription failed: ${e.message}` }, { status: 500 });
    }

    // Step 2: Summarize
    let aiResult = { summary: '', key_points: '', sentiment: 'neutral', action_items: '' };
    try {
      aiResult = await generateSummary(transcript, openaiKey);
    } catch (e) {
      console.error('Summary generation failed, saving transcript only:', e.message);
    }

    // Step 3: Save transcript + summary
    await base44.asServiceRole.entities.RingCentral_Call.update(call.id, {
      transcript,
      transcript_status: 'completed',
      summary: aiResult.summary || '',
      key_points: aiResult.key_points || '',
      sentiment: ['positive', 'neutral', 'negative'].includes(aiResult.sentiment) ? aiResult.sentiment : 'neutral',
      action_items: aiResult.action_items || '',
      ai_processed_at: new Date().toISOString()
    });

    // Step 4: Log activity to matched contact/deal
    if (call.contact_id || call.deal_id) {
      const activityData = {
        activity_type: 'Call',
        direction: call.direction === 'Inbound' ? 'Inbound' : 'Outbound',
        subject: `Call ${call.direction} — ${aiResult.summary ? aiResult.summary.substring(0, 80) + '...' : 'Recording processed'}`,
        description: [
          aiResult.summary ? `Summary: ${aiResult.summary}` : '',
          aiResult.key_points ? `\nKey Points:\n${aiResult.key_points}` : '',
          aiResult.action_items ? `\nAction Items:\n${aiResult.action_items}` : '',
          transcript ? `\nTranscript:\n${transcript.substring(0, 2000)}` : ''
        ].filter(Boolean).join('\n'),
        activity_date: call.call_datetime || new Date().toISOString(),
        duration_minutes: call.duration_seconds ? Math.round(call.duration_seconds / 60) : null,
        status: 'Completed',
        contact_id: call.contact_id || null,
        deal_id: call.deal_id || null,
        recording_url: call.recording_url
      };
      await base44.asServiceRole.entities.Activity.create(activityData);
    }

    // Step 5: If no deal linked, try to find one via contact
    if (!call.deal_id && call.contact_id) {
      const deals = await base44.asServiceRole.entities.Deal.filter({ contact_id: call.contact_id });
      if (deals[0]) {
        await base44.asServiceRole.entities.RingCentral_Call.update(call.id, { deal_id: deals[0].id });
      }
    }

    return Response.json({
      success: true,
      transcript_length: transcript.length,
      sentiment: aiResult.sentiment,
      has_summary: !!aiResult.summary,
      action_items_count: (aiResult.action_items || '').split('\n').filter(l => l.startsWith('•')).length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});