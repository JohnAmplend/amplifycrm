import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objectType, recordIds } = await req.json();

    if (!objectType || !recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return Response.json({ 
        error: 'Missing required parameters: objectType and recordIds' 
      }, { status: 400 });
    }

    const startTime = Date.now();
    const results = {
      successful: [],
      failed: []
    };

    // Delete records one by one
    for (const recordId of recordIds) {
      try {
        await base44.asServiceRole.entities[objectType].delete(recordId);
        results.successful.push(recordId);
      } catch (error) {
        results.failed.push({
          recordId,
          error: error.message
        });
      }
    }

    // Log the operation
    const operationLog = await base44.asServiceRole.entities.Bulk_Operations.create({
      operation_type: 'Delete',
      object_type: objectType,
      total_records: recordIds.length,
      successful_records: results.successful.length,
      failed_records: results.failed.length,
      status: results.failed.length === 0 ? 'Completed' : 
              results.successful.length === 0 ? 'Failed' : 'Partially Completed',
      error_log: results.failed.length > 0 ? { errors: results.failed } : null,
      operation_details: {
        action: 'Delete records',
        recordIds: recordIds
      },
      can_undo: false,
      performed_by: user.email,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      operationId: operationLog.id,
      totalRecords: recordIds.length,
      successfulRecords: results.successful.length,
      failedRecords: results.failed.length,
      errors: results.failed,
      duration: Date.now() - startTime
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});