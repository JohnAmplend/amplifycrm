import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all activities with RingCentral recordings that haven't been downloaded yet
    const activities = await base44.asServiceRole.entities.Activity.list();
    
    const activitiesWithRecordings = activities.filter(activity => 
      activity.custom_data?.recording_url && 
      !activity.recording_url // Not yet downloaded to Base44
    );

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    const RINGCENTRAL_JWT_TOKEN = Deno.env.get("RINGCENTRAL_JWT_TOKEN");
    if (!RINGCENTRAL_JWT_TOKEN) {
      return Response.json({ 
        error: 'RingCentral JWT token not configured' 
      }, { status: 400 });
    }

    for (const activity of activitiesWithRecordings) {
      try {
        const recordingUrl = activity.custom_data.recording_url;
        
        // Download recording from RingCentral
        const recordingResponse = await fetch(recordingUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${RINGCENTRAL_JWT_TOKEN}`
          }
        });

        if (!recordingResponse.ok) {
          throw new Error(`Failed to download: ${recordingResponse.statusText}`);
        }

        const recordingBlob = await recordingResponse.blob();
        
        // Upload to Base44
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
          file: recordingBlob
        });

        // Update activity with Base44 URL
        await base44.asServiceRole.entities.Activity.update(activity.id, {
          recording_url: uploadResult.file_url
        });

        successCount++;
      } catch (error) {
        failureCount++;
        errors.push({
          activity_id: activity.id,
          subject: activity.subject,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      total_recordings: activitiesWithRecordings.length,
      downloaded: successCount,
      failed: failureCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Sync recordings error:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync recordings' 
    }, { status: 500 });
  }
});