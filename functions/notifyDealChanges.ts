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
                await base44.asServiceRole.functions.invoke('createNotification', {
                    user_id: data.deal_owner,
                    title: 'New Deal Assignment',
                    message: `You have been assigned as owner of deal: ${data.deal_name}`,
                    link: `/deals`,
                    entity_type: 'Deal',
                    entity_id: data.id
                });
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});