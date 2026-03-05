import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const appId = Deno.env.get('BASE44_APP_ID');
    const serviceToken = req.headers.get('x-base44-service-token') || req.headers.get('authorization')?.replace('Bearer ', '');

    const response = await fetch(`https://api.base44.com/api/apps/${appId}/entities/User/`, {
      headers: {
        'Authorization': `Bearer ${serviceToken}`,
        'x-base44-service-role': 'true',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ success: false, error: err, users: [] }, { status: response.status });
    }

    const users = await response.json();
    return Response.json({ success: true, users: users || [] });

  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ success: false, error: error.message, users: [] }, { status: 500 });
  }
});