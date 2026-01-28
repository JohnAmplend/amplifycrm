import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data, old_data } = await req.json();

        if (!data) {
            return Response.json({ error: 'No data provided' }, { status: 400 });
        }

        const currentUser = event.created_by || data.created_by;

        // Check deal_owner
        if (data.deal_owner && data.deal_owner !== currentUser) {
            if (event.type === 'create' || (old_data && old_data.deal_owner !== data.deal_owner)) {
                await base44.asServiceRole.entities.Notifications.create({
                    user_id: data.deal_owner,
                    notification_type: 'Deal Won',
                    notification_title: 'New Deal Assignment',
                    notification_message: `You have been assigned as owner of deal: ${data.deal_name}`,
                    action_url: `/deals`,
                    is_read: false
                });
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});