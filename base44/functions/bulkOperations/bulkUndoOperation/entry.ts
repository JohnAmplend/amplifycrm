import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operationId } = await req.json();

    if (!operationId) {
      return Response.json({ 
        error: 'Missing required parameter: operationId' 
      }, { status: 400 });
    }

    const operations = await base44.asServiceRole.entities.Bulk_Operations.filter({ id: operationId });
    
    if (operations.length === 0) {
      return Response.json({ error: 'Operation not found' }, { status: 404 });
    }

    const operation = operations[0];

    if (!operation.can_undo) {
      return Response.json({ error: 'This operation cannot be undone' }, { status: 400 });
    }

    if (new Date(operation.undo_expires_at) < new Date()) {
      return Response.json({ error: 'Undo period has expired' }, { status: 400 });
    }

    const startTime = Date.now();
    const results = {
      successful: [],
      failed: []
    };

    // Restore original values
    const undoData = operation.undo_data || {};
    
    for (const [recordId, originalValue] of Object.entries(undoData)) {
      try {
        if (operation.operation_type === 'Update Owner') {
          const ownerField = operation.operation_details.ownerField;
          await base44.asServiceRole.entities[operation.object_type].update(recordId, {
            [ownerField]: originalValue
          });
        } else if (operation.operation_type === 'Add Tags' || operation.operation_type === 'Remove Tags') {
          await base44.asServiceRole.entities[operation.object_type].update(recordId, {
            tags: originalValue
          });
        }
        results.successful.push(recordId);
      } catch (error) {
        results.failed.push({
          recordId,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      totalRecords: Object.keys(undoData).length,
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