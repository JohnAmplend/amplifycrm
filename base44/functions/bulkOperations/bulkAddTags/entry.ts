import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objectType, recordIds, tags } = await req.json();

    if (!objectType || !recordIds || !Array.isArray(recordIds) || !tags || !Array.isArray(tags)) {
      return Response.json({ 
        error: 'Missing required parameters: objectType, recordIds, and tags' 
      }, { status: 400 });
    }

    const startTime = Date.now();
    const results = {
      successful: [],
      failed: []
    };

    const undoData = {};

    // Update records one by one
    for (const recordId of recordIds) {
      try {
        const record = await base44.asServiceRole.entities[objectType].filter({ id: recordId });
        if (record.length > 0) {
          const existingTags = record[0].tags || [];
          undoData[recordId] = existingTags;
          
          const newTags = [...new Set([...existingTags, ...tags])];
          
          await base44.asServiceRole.entities[objectType].update(recordId, {
            tags: newTags,
            last_bulk_operation_id: 'pending'
          });
          results.successful.push(recordId);
        }
      } catch (error) {
        results.failed.push({
          recordId,
          error: error.message
        });
      }
    }

    const undoExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Log the operation
    const operationLog = await base44.asServiceRole.entities.Bulk_Operations.create({
      operation_type: 'Add Tags',
      object_type: objectType,
      total_records: recordIds.length,
      successful_records: results.successful.length,
      failed_records: results.failed.length,
      status: results.failed.length === 0 ? 'Completed' : 
              results.successful.length === 0 ? 'Failed' : 'Partially Completed',
      error_log: results.failed.length > 0 ? { errors: results.failed } : null,
      operation_details: {
        action: 'Add tags',
        tags
      },
      can_undo: true,
      undo_data: undoData,
      undo_expires_at: undoExpiresAt,
      performed_by: user.email,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    });

    // Update records with operation ID
    for (const recordId of results.successful) {
      await base44.asServiceRole.entities[objectType].update(recordId, {
        last_bulk_operation_id: operationLog.id
      });
    }

    return Response.json({
      success: true,
      operationId: operationLog.id,
      totalRecords: recordIds.length,
      successfulRecords: results.successful.length,
      failedRecords: results.failed.length,
      errors: results.failed,
      canUndo: true,
      undoExpiresAt,
      duration: Date.now() - startTime
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});