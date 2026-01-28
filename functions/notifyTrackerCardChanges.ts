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

        // Check for mentions in comments
        if (data.comments && Array.isArray(data.comments)) {
            const oldComments = old_data?.comments || [];
            const newComments = data.comments.slice(oldComments.length);
            
            newComments.forEach(comment => {
                const mentions = comment.comment_text?.match(/@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g) || [];
                mentions.forEach(mention => {
                    const email = mention.substring(1);
                    if (email !== currentUser) {
                        usersToNotify.add(email);
                    }
                });
            });
        }

        // Create notifications
        for (const userId of usersToNotify) {
            const isAssigned = userId === data.assigned_to;
            const isCollaborator = data.collaborators?.includes(userId);
            
            let title, message;
            if (isAssigned && (event.type === 'create' || old_data?.assigned_to !== data.assigned_to)) {
                title = 'New Card Assignment';
                message = `You have been assigned to card: ${data.title}`;
            } else if (isCollaborator) {
                title = 'Added as Collaborator';
                message = `You have been added as a collaborator on card: ${data.title}`;
            } else {
                title = 'Mentioned in Comment';
                message = `You were mentioned in a comment on card: ${data.title}`;
            }

            await base44.asServiceRole.functions.invoke('createNotification', {
                user_id: userId,
                title,
                message,
                link: `/sales-tracker?cardId=${data.id}`,
                entity_type: 'Tracker_Card',
                entity_id: data.id,
                custom_data: { card_id: data.id }
            });
        }

        return Response.json({ success: true, notified: Array.from(usersToNotify) });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});