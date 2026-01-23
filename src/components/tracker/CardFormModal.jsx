import React, { useState, useEffect } from "react";
import { X, Upload, FileText, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "../crm/useToast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function CardFormModal({ isOpen, onClose, onSave, card, columns }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    column_id: "",
    priority: "Medium",
    status: "To do",
    start_date: "",
    end_date: "",
    total_tasks: 0,
    completed_tasks: 0,
    assigned_to: "",
    collaborators: [],
    attachments: [],
    comments: []
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user
  useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user));
  }, []);

  // Fetch users via backend function (accessible to all users)
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getAllUsers');
        console.log('getAllUsers response:', response);
        return response.data?.users || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    retry: 3,
    staleTime: 60000
  });

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || "",
        description: card.description || "",
        column_id: card.column_id || "",
        priority: card.priority || "Medium",
        status: card.status || "To do",
        start_date: card.start_date || "",
        end_date: card.end_date || "",
        total_tasks: card.total_tasks || 0,
        completed_tasks: card.completed_tasks || 0,
        assigned_to: card.assigned_to || "",
        collaborators: card.collaborators || [],
        attachments: card.attachments || [],
        comments: card.comments || []
      });
    } else {
      setFormData({
        title: "",
        description: "",
        column_id: columns[0]?.id || "",
        priority: "Medium",
        status: "To do",
        start_date: "",
        end_date: "",
        total_tasks: 0,
        completed_tasks: 0,
        assigned_to: "",
        collaborators: [],
        attachments: [],
        comments: []
      });
    }
  }, [card, columns]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If user is assigned and status is 'To do', auto-change to 'In progress'
    const finalData = { ...formData, id: card?.id };
    if (finalData.assigned_to && finalData.status === 'To do' && !card) {
      finalData.status = 'In progress';
    }
    
    onSave(finalData);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newAttachment = {
        file_name: file.name,
        file_url: file_url,
        file_type: file.type
      };
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment]
      }));
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser || !card) return;
    
    const comment = {
      comment_text: newComment.trim(),
      author_email: currentUser.email,
      author_name: currentUser.full_name || currentUser.email,
      timestamp: new Date().toISOString()
    };
    
    const updatedComments = [...(formData.comments || []), comment];
    
    // Update local state
    setFormData(prev => ({
      ...prev,
      comments: updatedComments
    }));
    
    // Immediately save to database
    onSave({
      ...formData,
      id: card.id,
      comments: updatedComments
    });
    
    setNewComment("");
    toast.success('Comment added');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{card ? "Edit Card" : "Add New Card"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter card title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows={Math.max(6, Math.ceil((formData.description?.length || 0) / 50))}
              className="min-h-[150px] max-h-[400px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="column">Column</Label>
              <Select
                value={formData.column_id}
                onValueChange={(value) => setFormData({ ...formData, column_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
                  <SelectItem value="Highest">Highest</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[1100]">
                <SelectItem value="To do">To do</SelectItem>
                <SelectItem value="In progress">In progress</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent className="z-[1100]">
                <SelectItem value={null}>Unassigned</SelectItem>
                {usersLoading ? (
                  <SelectItem value={null} disabled>Loading users...</SelectItem>
                ) : usersError ? (
                  <SelectItem value={null} disabled>Error loading users</SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value={null} disabled>No users available</SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Collaborators</Label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {usersLoading ? (
                <div className="text-sm text-gray-500 p-2">Loading users...</div>
              ) : usersError ? (
                <div className="text-sm text-red-500 p-2">Error loading users</div>
              ) : users.length === 0 ? (
                <div className="text-sm text-gray-500 p-2">No users available</div>
              ) : (
                users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.collaborators.includes(user.email)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, collaborators: [...formData.collaborators, user.email] });
                        } else {
                          setFormData({ ...formData, collaborators: formData.collaborators.filter(c => c !== user.email) });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{user.full_name || user.email}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <Label>Attachments</Label>
            <div className="space-y-2">
              {formData.attachments?.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm flex-1 truncate">{file.file_name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                <span className="text-sm">{uploadingFile ? 'Uploading...' : 'Upload File'}</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>
            </div>
          </div>

          {card && (
            <div>
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({formData.comments?.length || 0})
              </Label>
              <div className="border border-gray-200 rounded-lg p-3 space-y-3 max-h-64 overflow-y-auto bg-gray-50">
                {formData.comments && formData.comments.length > 0 ? (
                  formData.comments.map((comment, index) => (
                    <div key={index} className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{comment.author_name}</span>
                        <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment_text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              {card ? "Update" : "Add Card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}