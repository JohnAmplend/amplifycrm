import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gmail_account_id } = await req.json();

    if (!gmail_account_id) {
      return Response.json({ error: 'gmail_account_id required' }, { status: 400 });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return Response.json({ error: 'Google OAuth not configured' }, { status: 400 });
    }

    // Get the account
    const accounts = await base44.entities.GmailAccount.filter({
      id: gmail_account_id
    });

    if (accounts.length === 0) {
      return Response.json({ error: 'Gmail account not found' }, { status: 404 });
    }

    const account = accounts[0];

    if (!account.refresh_token) {
      return Response.json({ error: 'No refresh token available' }, { status: 400 });
    }

    // Refresh the access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Update the account
    await base44.asServiceRole.entities.GmailAccount.update(gmail_account_id, {
      access_token: access_token,
      expires_at: expiresAt
    });

    return Response.json({
      success: true,
      access_token: access_token,
      expires_at: expiresAt
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});