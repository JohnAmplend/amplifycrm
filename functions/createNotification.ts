import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { user_id, title, message, link, notification_type } = await req.json();

        if (!user_id || !title || !message) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create notification
        const notification = await base44.asServiceRole.entities.Notifications.create({
            user_id,
            notification_type: notification_type || 'System',
            notification_title: title,
            notification_message: message,
            action_url: link,
            is_read: false
        });

        return Response.json({ success: true, notification });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});