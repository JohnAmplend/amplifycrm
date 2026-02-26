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

    // Get the account
    const accounts = await base44.entities.GmailAccount.filter({
      id: gmail_account_id
    });

    if (accounts.length === 0) {
      return Response.json({ error: 'Gmail account not found' }, { status: 404 });
    }

    const account = accounts[0];
    let accessToken = account.access_token;

    // Check if token expired
    const now = new Date();
    const expiresAt = new Date(account.expires_at);
    
    if (now >= expiresAt) {
      // Refresh token
      const refreshResult = await base44.functions.invoke('gmail/refreshGmailAccessToken', {
        gmail_account_id: gmail_account_id
      });
      
      if (!refreshResult.data?.success) {
        throw new Error('Failed to refresh access token');
      }
      
      accessToken = refreshResult.data.access_token;
    }

    // Determine date range for query
    let query = '';
    if (account.last_sync_at) {
      const lastSync = new Date(account.last_sync_at);
      const lastSyncSeconds = Math.floor(lastSync.getTime() / 1000);
      query = `after:${lastSyncSeconds}`;
    } else {
      // First sync: last 7 days
      const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      query = `after:${sevenDaysAgo}`;
    }

    // List messages
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=500`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!listResponse.ok) {
      const error = await listResponse.text();
      throw new Error(`Failed to list messages: ${error}`);
    }

    const listData = await listResponse.json();
    const messages = listData.messages || [];

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Fetch and store each message
    for (const msg of messages) {
      try {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        );

        if (!msgResponse.ok) {
          throw new Error(`Failed to fetch message ${msg.id}`);
        }

        const msgData = await msgResponse.json();
        
        // Parse headers
        const headers = msgData.payload.headers;
        const getHeader = (name) => {
          const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
          return header ? header.value : '';
        };

        const fromEmail = getHeader('From');
        const toEmails = getHeader('To').split(',').map(e => e.trim());
        const subject = getHeader('Subject');
        const internalDate = new Date(parseInt(msgData.internalDate)).toISOString();
        const snippet = msgData.snippet || '';
        const threadId = msgData.threadId;
        const labelIds = msgData.labelIds || [];

        // Check if message already exists
        const existingMessages = await base44.asServiceRole.entities.EmailMessage.filter({
          gmail_message_id: msgData.id
        });

        if (existingMessages.length > 0) {
          // Update existing
          await base44.asServiceRole.entities.EmailMessage.update(existingMessages[0].id, {
            thread_id: threadId,
            internal_date: internalDate,
            from_email: fromEmail,
            to_emails: toEmails,
            subject: subject,
            snippet: snippet,
            label_ids: labelIds,
            synced_at: new Date().toISOString()
          });
          updatedCount++;
        } else {
          // Create new
          await base44.asServiceRole.entities.EmailMessage.create({
            gmail_message_id: msgData.id,
            thread_id: threadId,
            internal_date: internalDate,
            from_email: fromEmail,
            to_emails: toEmails,
            subject: subject,
            snippet: snippet,
            label_ids: labelIds,
            gmail_account_id: gmail_account_id,
            synced_at: new Date().toISOString()
          });
          createdCount++;
        }
      } catch (error) {
        console.error(`Error processing message ${msg.id}:`, error);
        errorCount++;
      }
    }

    // Update last_sync_at
    await base44.asServiceRole.entities.GmailAccount.update(gmail_account_id, {
      last_sync_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      total_messages: messages.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount
    });

  } catch (error) {
    console.error('Sync Gmail messages error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});