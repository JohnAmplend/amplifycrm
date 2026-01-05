import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    assigned_to: ""
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
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
        assigned_to: card.assigned_to || ""
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
        assigned_to: ""
      });
    }
  }, [card, columns]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: card?.id });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
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
              rows={3}
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
                <SelectContent>
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
                <SelectContent>
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
              <SelectContent>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_tasks">Total Subtasks</Label>
              <Input
                id="total_tasks"
                type="number"
                min="0"
                value={formData.total_tasks}
                onChange={(e) => setFormData({ ...formData, total_tasks: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="completed_tasks">Completed Subtasks</Label>
              <Input
                id="completed_tasks"
                type="number"
                min="0"
                max={formData.total_tasks}
                value={formData.completed_tasks}
                onChange={(e) => setFormData({ ...formData, completed_tasks: parseInt(e.target.value) || 0 })}
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
              <SelectContent>
                <SelectItem value={null}>Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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