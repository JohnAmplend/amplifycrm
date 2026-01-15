import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResendInvites() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const me = await base44.auth.me();
      setCurrentUser(me);
      
      if (me.role !== 'admin') {
        toast.error('Only admins can access this page');
        return;
      }

      const response = await base44.functions.invoke('getAllUsers');
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resendInvite = async (user) => {
    setSending(prev => ({ ...prev, [user.email]: true }));
    try {
      await base44.users.inviteUser(user.email, user.role || 'user');
      toast.success(`Invite sent to ${user.email}`);
    } catch (error) {
      toast.error(`Failed to send invite to ${user.email}`);
      console.error(error);
    } finally {
      setSending(prev => ({ ...prev, [user.email]: false }));
    }
  };

  const resendAllInvites = async () => {
    for (const user of users) {
      if (user.email !== currentUser?.email) {
        await resendInvite(user);
        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    toast.success('All invites sent!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>Only administrators can access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resend User Invites</CardTitle>
            <Button onClick={resendAllInvites} className="gap-2">
              <Mail className="w-4 h-4" />
              Resend All Invites
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.email}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium">{user.full_name || user.email}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Role: {user.role || 'user'}
                  </p>
                </div>
                <Button
                  onClick={() => resendInvite(user)}
                  disabled={sending[user.email] || user.email === currentUser?.email}
                  variant="outline"
                  className="gap-2"
                >
                  {sending[user.email] ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : user.email === currentUser?.email ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      You
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Resend Invite
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}