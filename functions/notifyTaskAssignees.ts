import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { card_id, card_title, action } = await req.json();

    // Fetch the card details
    const cards = await base44.entities.Tracker_Card.filter({ id: card_id });
    if (cards.length === 0) {
      return Response.json({ error: 'Card not found' }, { status: 404 });
    }

    const card = cards[0];
    const notificationsToCreate = [];

    // Notify assigned user
    if (card.assigned_to && card.assigned_to !== user.email) {
      notificationsToCreate.push({
        user_id: card.assigned_to,
        type: 'task_assigned',
        title: action === 'created' ? 'New Task Assigned' : 'Task Updated',
        message: `${user.full_name || user.email} ${action === 'created' ? 'assigned' : 'updated'} you to: ${card_title}`,
        link: `/SalesTracker`,
        is_read: false,
        priority: 'medium'
      });
    }

    // Notify collaborators
    if (card.collaborators && Array.isArray(card.collaborators)) {
      for (const collaboratorEmail of card.collaborators) {
        if (collaboratorEmail !== user.email) {
          notificationsToCreate.push({
            user_id: collaboratorEmail,
            type: 'task_collaboration',
            title: action === 'created' ? 'Added as Collaborator' : 'Task Updated',
            message: `${user.full_name || user.email} ${action === 'created' ? 'added you as collaborator on' : 'updated'}: ${card_title}`,
            link: `/SalesTracker`,
            is_read: false,
            priority: 'low'
          });
        }
      }
    }

    // Create all notifications
    for (const notification of notificationsToCreate) {
      await base44.asServiceRole.entities.Notifications.create(notification);
    }

    return Response.json({ 
      success: true, 
      notifications_sent: notificationsToCreate.length 
    });

  } catch (error) {
    console.error('Error creating notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});