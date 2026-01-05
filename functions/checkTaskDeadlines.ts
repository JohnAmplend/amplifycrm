import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active tasks with end dates
    const cards = await base44.asServiceRole.entities.Tracker_Card.list();
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    let notificationsCreated = 0;

    for (const card of cards) {
      if (!card.end_date || card.status === 'Done') continue;

      const endDate = new Date(card.end_date);
      
      // Check if task is within 3 days of deadline
      if (endDate <= threeDaysFromNow && endDate >= now) {
        const daysUntilDeadline = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        // Check if notification already sent today
        const existingNotifications = await base44.asServiceRole.entities.Notifications.filter({
          type: 'task_deadline',
          message: { $regex: card.title }
        });
        
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const alreadyNotifiedToday = existingNotifications.some(n => 
          new Date(n.created_date) >= todayStart
        );

        if (!alreadyNotifiedToday) {
          const notificationsToCreate = [];

          // Notify assigned user
          if (card.assigned_to) {
            notificationsToCreate.push({
              user_id: card.assigned_to,
              type: 'task_deadline',
              title: daysUntilDeadline === 0 ? 'Task Due Today!' : `Task Due in ${daysUntilDeadline} Day${daysUntilDeadline > 1 ? 's' : ''}`,
              message: `"${card.title}" is ${daysUntilDeadline === 0 ? 'due today' : `due in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`}`,
              link: `/SalesTracker`,
              is_read: false,
              priority: daysUntilDeadline === 0 ? 'high' : 'medium'
            });
          }

          // Notify collaborators
          if (card.collaborators && Array.isArray(card.collaborators)) {
            for (const collaboratorEmail of card.collaborators) {
              notificationsToCreate.push({
                user_id: collaboratorEmail,
                type: 'task_deadline',
                title: daysUntilDeadline === 0 ? 'Task Due Today!' : `Task Due in ${daysUntilDeadline} Day${daysUntilDeadline > 1 ? 's' : ''}`,
                message: `"${card.title}" is ${daysUntilDeadline === 0 ? 'due today' : `due in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`}`,
                link: `/SalesTracker`,
                is_read: false,
                priority: daysUntilDeadline === 0 ? 'high' : 'medium'
              });
            }
          }

          // Create all notifications
          for (const notification of notificationsToCreate) {
            await base44.asServiceRole.entities.Notifications.create(notification);
            notificationsCreated++;
          }
        }
      }
    }

    return Response.json({ 
      success: true, 
      notifications_created: notificationsCreated,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking task deadlines:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});