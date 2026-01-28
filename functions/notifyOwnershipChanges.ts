import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data, old_data } = await req.json();

        if (!data) {
            return Response.json({ error: 'No data provided' }, { status: 400 });
        }

        const currentUser = event.created_by || data.created_by;
        const entityType = event.entity_name;
        
        // Determine owner field and entity name based on type
        let ownerField, entityName, link;
        if (entityType === 'Contact') {
            ownerField = 'contact_owner';
            entityName = `${data.first_name} ${data.last_name}`;
            link = '/contacts';
        } else if (entityType === 'Company') {
            ownerField = 'company_owner';
            entityName = data.company_name;
            link = '/companies';
        } else if (entityType === 'Lead') {
            ownerField = 'lead_owner';
            entityName = `${data.first_name} ${data.last_name}`;
            link = '/leads';
        } else {
            return Response.json({ success: true, message: 'Entity type not supported' });
        }

        const newOwner = data[ownerField];
        const oldOwner = old_data?.[ownerField];

        // Notify if owner changed and new owner is not the current user
        if (newOwner && newOwner !== currentUser && newOwner !== oldOwner) {
            await base44.asServiceRole.functions.invoke('createNotification', {
                user_id: newOwner,
                title: `New ${entityType} Assignment`,
                message: `You have been assigned as owner of ${entityType.toLowerCase()}: ${entityName}`,
                link,
                notification_type: 'System'
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});