import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data, old_data } = await req.json();

        if (!data) {
            return Response.json({ error: 'No data provided' }, { status: 400 });
        }

        const usersToNotify = new Set();
        const currentUser = event.created_by || data.created_by;

        // Check assigned_to
        if (data.assigned_to && data.assigned_to !== currentUser) {
            if (event.type === 'create' || (old_data && old_data.assigned_to !== data.assigned_to)) {
                usersToNotify.add(data.assigned_to);
            }
        }

        // Create notifications
        for (const userId of usersToNotify) {
            await base44.asServiceRole.functions.invoke('createNotification', {
                user_id: userId,
                title: 'New Activity Assignment',
                message: `You have been assigned to activity: ${data.subject}`,
                link: `/activities`,
                notification_type: 'System'
            });
        }

        return Response.json({ success: true, notified: Array.from(usersToNotify) });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});