import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recording_url, activity_id } = await req.json();
    
    if (!recording_url) {
      return Response.json({ error: 'recording_url is required' }, { status: 400 });
    }

    const RINGCENTRAL_JWT_TOKEN = Deno.env.get("RINGCENTRAL_JWT_TOKEN");
    if (!RINGCENTRAL_JWT_TOKEN) {
      return Response.json({ 
        error: 'RingCentral JWT token not configured' 
      }, { status: 400 });
    }

    // Download recording from RingCentral
    const recordingResponse = await fetch(recording_url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RINGCENTRAL_JWT_TOKEN}`
      }
    });

    if (!recordingResponse.ok) {
      throw new Error(`Failed to download recording: ${recordingResponse.statusText}`);
    }

    // Get the recording as a blob
    const recordingBlob = await recordingResponse.blob();
    
    // Create FormData to upload to Base44
    const formData = new FormData();
    formData.append('file', recordingBlob, `recording-${activity_id || Date.now()}.mp3`);

    // Upload to Base44 using the SDK
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
      file: recordingBlob
    });

    const base44RecordingUrl = uploadResult.file_url;

    // Update activity if activity_id provided
    if (activity_id) {
      await base44.asServiceRole.entities.Activity.update(activity_id, {
        recording_url: base44RecordingUrl
      });
    }

    return Response.json({
      success: true,
      recording_url: base44RecordingUrl,
      activity_id
    });

  } catch (error) {
    console.error('Download recording error:', error);
    return Response.json({ 
      error: error.message || 'Failed to download recording' 
    }, { status: 500 });
  }
});