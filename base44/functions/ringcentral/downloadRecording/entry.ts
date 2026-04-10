import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();

    const recordingUrl = body.recording?.contentUri;
    const callId = body.sessionId;

    if (!recordingUrl) {
      return Response.json({ success: true });
    }

    const token = Deno.env.get("RINGCENTRAL_JWT_TOKEN");

    const res = await fetch(recordingUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const blob = await res.blob();
    const file = new File([blob], `recording-${callId}.mp3`);

    const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    const calls = await base44.asServiceRole.entities.RingCentral_Call.filter({ call_id: callId });
    const match = calls[0];

    if (match) {
      await base44.asServiceRole.entities.RingCentral_Call.update(match.id, {
        recording_url: upload.file_url
      });
    }

    return Response.json({ success: true });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});