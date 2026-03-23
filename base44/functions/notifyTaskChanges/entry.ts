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

        // Check collaborators
        if (data.collaborators && Array.isArray(data.collaborators)) {
            const oldCollaborators = old_data?.collaborators || [];
            const newCollaborators = data.collaborators.filter(c => !oldCollaborators.includes(c) && c !== currentUser);
            newCollaborators.forEach(c => usersToNotify.add(c));
        }

        // Create notifications
        for (const userId of usersToNotify) {
            const isAssigned = userId === data.assigned_to;
            const title = isAssigned ? 'New Task Assignment' : 'Added as Collaborator';
            const message = isAssigned 
                ? `You have been assigned to task: ${data.task_name}`
                : `You have been added as a collaborator on task: ${data.task_name}`;

            await base44.asServiceRole.entities.Notifications.create({
                user_id: userId,
                notification_type: 'Task Due',
                notification_title: title,
                notification_message: message,
                action_url: `/tasks`,
                is_read: false
            });
        }

        return Response.json({ success: true, notified: Array.from(usersToNotify) });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});