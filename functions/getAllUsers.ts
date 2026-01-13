import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to fetch all users (bypasses security rules)
    const users = await base44.asServiceRole.entities.User.list();

    return Response.json({ 
      success: true,
      users: users || []
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      users: []
    }, { status: 500 });
  }
});