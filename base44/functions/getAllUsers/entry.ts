import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Simple in-memory cache to prevent 429 rate limiting
let cachedUsers = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = Date.now();
    if (cachedUsers && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return Response.json({ success: true, users: cachedUsers, cached: true });
    }

    const users = await base44.asServiceRole.entities.User.list();
    cachedUsers = users || [];
    cacheTimestamp = now;

    return Response.json({ success: true, users: cachedUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    // Return cached data if available on error, rather than failing
    if (cachedUsers) {
      return Response.json({ success: true, users: cachedUsers, cached: true });
    }
    return Response.json({ success: false, error: error.message, users: [] }, { status: 500 });
  }
});