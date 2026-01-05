import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const colorOptions = [
  { name: "Yellow", value: "#FEF3C7" },
  { name: "Green", value: "#DCFCE7" },
  { name: "Red", value: "#FEE2E2" },
  { name: "Blue", value: "#DBEAFE" },
  { name: "Purple", value: "#F3E8FF" },
  { name: "Orange", value: "#FFEDD5" },
  { name: "Pink", value: "#FCE7F3" },
  { name: "Gray", value: "#F3F4F6" },
];

export default function ColumnFormModal({ isOpen, onClose, onSave, column }) {
  const [formData, setFormData] = useState({
    title: "",
    color: "#FEF3C7"
  });

  useEffect(() => {
    if (column) {
      setFormData({
        title: column.title || "",
        color: column.color || "#FEF3C7"
      });
    } else {
      setFormData({
        title: "",
        color: "#FEF3C7"
      });
    }
  }, [column]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: column?.id });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{column ? "Edit Column" : "Add New Column"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Column Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter column title"
              required
            />
          </div>

          <div>
            <Label>Column Color</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-10 rounded-lg border-2 transition-all ${
                    formData.color === color.value
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
              {column ? "Update" : "Add Column"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}