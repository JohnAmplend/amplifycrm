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
            await base44.asServiceRole.entities.Notifications.create({
                user_id: userId,
                notification_type: 'System',
                notification_title: 'New Activity Assignment',
                notification_message: `You have been assigned to activity: ${data.subject}`,
                action_url: `/activities`,
                is_read: false
            });
        }

        return Response.json({ success: true, notified: Array.from(usersToNotify) });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});