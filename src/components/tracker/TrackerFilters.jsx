import React, { useState } from "react";
import { Filter, Save, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function TrackerFilters({ onFilterChange, currentFilters }) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    priority: currentFilters?.priority || "all",
    status: currentFilters?.status || "all",
    assignee: currentFilters?.assignee || "all",
    collaborator: currentFilters?.collaborator || "all",
    startDate: currentFilters?.startDate || "",
    endDate: currentFilters?.endDate || ""
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Fetch saved presets from user's custom_data
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const savedPresets = user?.tracker_filter_presets || [];

  const savePresetMutation = useMutation({
    mutationFn: async (preset) => {
      const updatedPresets = [...savedPresets, preset];
      await base44.auth.updateMe({ tracker_filter_presets: updatedPresets });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setShowSavePreset(false);
      setPresetName("");
    }
  });

  const deletePresetMutation = useMutation({
    mutationFn: async (presetName) => {
      const updatedPresets = savedPresets.filter(p => p.name !== presetName);
      await base44.auth.updateMe({ tracker_filter_presets: updatedPresets });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });

  const handleApplyFilters = () => {
    onFilterChange(filters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      priority: "all",
      status: "all",
      assignee: "all",
      collaborator: "all",
      startDate: "",
      endDate: ""
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    
    savePresetMutation.mutate({
      name: presetName,
      filters: filters
    });
  };

  const handleLoadPreset = (preset) => {
    setFilters(preset.filters);
    onFilterChange(preset.filters);
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "all" && v !== "").length;

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={() => setShowFilters(true)}
        className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {savedPresets.length > 0 && (
        <Select onValueChange={(presetName) => {
          const preset = savedPresets.find(p => p.name === presetName);
          if (preset) handleLoadPreset(preset);
        }}>
          <SelectTrigger className="w-48 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
            <SelectValue placeholder="Load Preset..." />
          </SelectTrigger>
          <SelectContent>
            {savedPresets.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Filter Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="Highest">Highest</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="To do">To do</SelectItem>
                    <SelectItem value="In progress">In progress</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assignee</Label>
                <Select value={filters.assignee} onValueChange={(v) => setFilters({ ...filters, assignee: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Collaborator</Label>
                <Select value={filters.collaborator} onValueChange={(v) => setFilters({ ...filters, collaborator: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date From</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date To</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset
                </Button>
                <Button variant="outline" onClick={() => setShowSavePreset(true)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preset
                </Button>
              </div>
              <Button onClick={handleApplyFilters} className="bg-blue-500 hover:bg-blue-600">
                Apply Filters
              </Button>
            </div>

            {savedPresets.length > 0 && (
              <div className="border-t pt-4">
                <Label>Saved Presets</Label>
                <div className="space-y-2 mt-2">
                  {savedPresets.map((preset) => (
                    <div key={preset.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{preset.name}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePresetMutation.mutate(preset.name)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Preset Dialog */}
      <Dialog open={showSavePreset} onOpenChange={setShowSavePreset}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Preset Name</Label>
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., High Priority Tasks"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSavePreset(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreset} className="bg-blue-500 hover:bg-blue-600">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}