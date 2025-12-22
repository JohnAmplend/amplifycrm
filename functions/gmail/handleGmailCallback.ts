import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, state } = await req.json();

    if (!code || !state) {
      return Response.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // Validate state contains current user's email
    if (!state.includes(user.email)) {
      return Response.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const REDIRECT_URI = "https://crm.amplend.net/auth/google/gmail/callback";

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return Response.json({ error: 'Google OAuth not configured' }, { status: 400 });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!refresh_token) {
      return Response.json({ 
        error: 'No refresh token received. User may need to revoke access and reconnect.' 
      }, { status: 400 });
    }

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    const { email: gmail_email, id: google_sub } = userInfo;

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Check for existing account
    const existingAccounts = await base44.asServiceRole.entities.GmailAccount.filter({
      google_sub: google_sub
    });

    if (existingAccounts.length > 0) {
      // Update existing
      await base44.asServiceRole.entities.GmailAccount.update(existingAccounts[0].id, {
        user_email: gmail_email,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAt,
        last_sync_at: now
      });

      return Response.json({
        success: true,
        gmail_account_id: existingAccounts[0].id,
        email: gmail_email
      });
    } else {
      // Create new
      const newAccount = await base44.asServiceRole.entities.GmailAccount.create({
        user_email: gmail_email,
        google_sub: google_sub,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAt,
        connected_at: now,
        last_sync_at: now
      });

      return Response.json({
        success: true,
        gmail_account_id: newAccount.id,
        email: gmail_email
      });
    }

  } catch (error) {
    console.error('Gmail callback error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});