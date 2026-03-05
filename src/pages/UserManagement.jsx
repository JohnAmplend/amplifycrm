import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Key, Loader2, AlertCircle, CheckCircle2, Lock, Unlock, Clock, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(null);

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

  const openPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowPasswordDialog(true);
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdating(true);
    try {
      await base44.asServiceRole.entities.User.update(selectedUser.id, {
        temporary_password: newPassword
      });
      toast.success(`Password updated for ${selectedUser.email}`);
      setShowPasswordDialog(false);
      setNewPassword("");
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update password');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const resendInvite = async (user) => {
    try {
      await base44.users.inviteUser(user.email, user.role || 'user');
      toast.success(`Invite sent to ${user.email}`);
    } catch (error) {
      toast.error(`Failed to send invite`);
      console.error(error);
    }
  };

  const sendPasswordReset = async (user) => {
    setSendingReset(user.id);
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "Password Reset Request - AmplifyCRM",
        body: `Hi ${user.full_name || user.email},\n\nYour CRM administrator has requested a password reset for your account.\n\nPlease contact your CRM admin to receive your new temporary password, or log in and use the "Forgot Password" option.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nAmplifyCRM Team`
      });
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      toast.error('Failed to send reset email');
      console.error(error);
    } finally {
      setSendingReset(null);
    }
  };

  const toggleFreeze = async (user) => {
    try {
      const newFrozenState = !user.is_frozen;
      await base44.entities.User.update(user.id, { is_frozen: newFrozenState });
      toast.success(`Account ${newFrozenState ? 'frozen' : 'unfrozen'} for ${user.email}`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update account status');
      console.error(error);
    }
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
    <div className="p-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.email}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${user.is_frozen ? 'bg-red-50 border-red-200' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.full_name || user.email}</p>
                    {user.is_frozen && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Frozen
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">
                      Role: {user.role || 'user'}
                    </p>
                    {user.last_login && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last login: {new Date(user.last_login).toLocaleString()}
                      </span>
                    )}
                    {user.temporary_password && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Password Set
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <Button
                    onClick={() => resendInvite(user)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Resend Invite
                  </Button>
                  <Button
                    onClick={() => openPasswordDialog(user)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Set Password
                  </Button>
                  {user.id !== currentUser?.id && (
                    <Button
                      onClick={() => toggleFreeze(user)}
                      variant={user.is_frozen ? "default" : "outline"}
                      size="sm"
                      className={`gap-2 ${user.is_frozen ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-red-600 border-red-300 hover:bg-red-50'}`}
                    >
                      {user.is_frozen ? <><Unlock className="w-4 h-4" /> Unfreeze</> : <><Lock className="w-4 h-4" /> Freeze</>}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Password for {selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                autoComplete="new-password"
              />
            </div>
            <p className="text-xs text-gray-500">
              This password will be stored and the user can use it to log in.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={updatePassword} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}