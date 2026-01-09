import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active cards
    const cards = await base44.asServiceRole.entities.Tracker_Card.list();
    
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    
    let remindersCreated = 0;
    let statusUpdated = 0;

    for (const card of cards) {
      // Check for tasks due in 2 days (if not already done)
      if (card.end_date && card.status !== 'Done') {
        const endDate = new Date(card.end_date);
        
        // Check if due date is within 2 days
        if (endDate >= now && endDate <= twoDaysFromNow) {
          // Check if we already sent a reminder today for this card
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const existingNotifications = await base44.asServiceRole.entities.Notifications.filter({
            type: 'task_reminder',
            created_date: { $gte: today.toISOString() }
          });
          
          const alreadyNotified = existingNotifications.some(n => 
            n.message && n.message.includes(card.title)
          );
          
          if (!alreadyNotified) {
            // Create reminder notifications for assigned user
            if (card.assigned_to) {
              await base44.asServiceRole.entities.Notifications.create({
                user_id: card.assigned_to,
                type: 'task_reminder',
                title: '⏰ Task Deadline Reminder',
                message: `Task "${card.title}" is due in 2 days`,
                link: '/SalesTracker',
                is_read: false
              });
              remindersCreated++;
            }
            
            // Also notify collaborators
            if (card.collaborators && card.collaborators.length > 0) {
              for (const collaborator of card.collaborators) {
                await base44.asServiceRole.entities.Notifications.create({
                  user_id: collaborator,
                  type: 'task_reminder',
                  title: '⏰ Task Deadline Reminder',
                  message: `Task "${card.title}" is due in 2 days`,
                  link: '/SalesTracker',
                  is_read: false
                });
                remindersCreated++;
              }
            }
          }
        }
      }

      // Auto-change status to 'In Progress' when a user is assigned (and status is 'To do')
      if (card.assigned_to && card.status === 'To do') {
        await base44.asServiceRole.entities.Tracker_Card.update(card.id, {
          status: 'In progress'
        });
        statusUpdated++;
      }
    }

    return Response.json({
      success: true,
      remindersCreated,
      statusUpdated,
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tracker automation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});