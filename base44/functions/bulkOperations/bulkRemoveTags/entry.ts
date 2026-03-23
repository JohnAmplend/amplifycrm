import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objectType, recordIds, tags } = await req.json();

    if (!objectType || !recordIds || !tags) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const entityMap = {
      'Contact': base44.asServiceRole.entities.Contact,
      'Company': base44.asServiceRole.entities.Company,
      'Deal': base44.asServiceRole.entities.Deal,
      'Lead': base44.asServiceRole.entities.Lead
    };

    const entity = entityMap[objectType];
    if (!entity) {
      return Response.json({ error: 'Invalid object type' }, { status: 400 });
    }

    // Create bulk operation record
    const operation = await base44.asServiceRole.entities.Bulk_Operations.create({
      operation_type: 'Remove Tags',
      object_type: objectType,
      total_records: recordIds.length,
      successful_records: 0,
      failed_records: 0,
      performed_by: user.email,
      operation_metadata: { tags },
      can_undo: true
    });

    let successCount = 0;
    let failCount = 0;
    const snapshot = [];

    for (const recordId of recordIds) {
      try {
        const record = await entity.get(recordId);
        const currentTags = record.tags || [];
        const newTags = currentTags.filter(t => !tags.includes(t));

        // Save snapshot for undo
        snapshot.push({
          record_id: recordId,
          old_data: { tags: currentTags },
          new_data: { tags: newTags }
        });

        await entity.update(recordId, { 
          tags: newTags,
          last_bulk_operation_id: operation.id
        });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    // Update operation with results
    await base44.asServiceRole.entities.Bulk_Operations.update(operation.id, {
      successful_records: successCount,
      failed_records: failCount,
      status: failCount > 0 ? 'Partial' : 'Completed',
      completed_at: new Date().toISOString(),
      operation_snapshot: snapshot
    });

    // Set undo expiration (5 minutes)
    const undoExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return Response.json({
      success: true,
      operationId: operation.id,
      totalRecords: recordIds.length,
      successfulRecords: successCount,
      failedRecords: failCount,
      canUndo: true,
      undoExpiresAt
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});