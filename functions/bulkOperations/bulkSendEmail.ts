import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contactIds, subject, body, fromName } = await req.json();

    if (!contactIds || !subject || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const operation = await base44.asServiceRole.entities.Bulk_Operations.create({
      operation_type: 'Send Email',
      object_type: 'Contact',
      total_records: contactIds.length,
      successful_records: 0,
      failed_records: 0,
      performed_by: user.email,
      operation_metadata: { subject, fromName },
      can_undo: false
    });

    let successCount = 0;
    let failCount = 0;

    for (const contactId of contactIds) {
      try {
        const contact = await base44.asServiceRole.entities.Contact.get(contactId);
        
        if (contact.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: fromName || user.full_name || 'AmplifyCRM',
            to: contact.email,
            subject: subject.replace('{{first_name}}', contact.first_name || '')
                          .replace('{{last_name}}', contact.last_name || ''),
            body: body.replace('{{first_name}}', contact.first_name || '')
                     .replace('{{last_name}}', contact.last_name || '')
                     .replace('{{company}}', contact.company_id || '')
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    await base44.asServiceRole.entities.Bulk_Operations.update(operation.id, {
      successful_records: successCount,
      failed_records: failCount,
      status: failCount > 0 ? 'Partial' : 'Completed',
      completed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      operationId: operation.id,
      totalRecords: contactIds.length,
      successfulRecords: successCount,
      failedRecords: failCount,
      canUndo: false
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});