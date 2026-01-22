import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactIds, listId } = await req.json();

    if (!contactIds || !listId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const operation = await base44.asServiceRole.entities.Bulk_Operations.create({
      operation_type: 'Add to List',
      object_type: 'Contact',
      total_records: contactIds.length,
      successful_records: 0,
      failed_records: 0,
      performed_by: user.email,
      operation_metadata: { listId },
      can_undo: true
    });

    let successCount = 0;
    let failCount = 0;
    const createdMembers = [];

    for (const contactId of contactIds) {
      try {
        // Check if already in list
        const existing = await base44.asServiceRole.entities.Contact_List_Member.filter({
          list_id: listId,
          contact_id: contactId
        });

        if (existing.length === 0) {
          const member = await base44.asServiceRole.entities.Contact_List_Member.create({
            list_id: listId,
            contact_id: contactId,
            status: 'Active'
          });
          createdMembers.push(member.id);
          successCount++;
        } else {
          successCount++; // Already in list, count as success
        }
      } catch (error) {
        failCount++;
      }
    }

    await base44.asServiceRole.entities.Bulk_Operations.update(operation.id, {
      successful_records: successCount,
      failed_records: failCount,
      status: failCount > 0 ? 'Partial' : 'Completed',
      completed_at: new Date().toISOString(),
      operation_snapshot: createdMembers.map(id => ({ member_id: id }))
    });

    const undoExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return Response.json({
      success: true,
      operationId: operation.id,
      totalRecords: contactIds.length,
      successfulRecords: successCount,
      failedRecords: failCount,
      canUndo: true,
      undoExpiresAt
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});