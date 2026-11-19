"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, User, Building, BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";
import { useLuminaStore, type StudentProfile } from "@/hooks/use-lumina-store";
import { toast } from "sonner";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { profile, updateProfile, clearData } = useLuminaStore();
  const [formData, setFormData] = useState<StudentProfile>(profile);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Load persisted profile from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lumina_student_profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFormData(parsed);
          updateProfile(parsed);
          return;
        } catch {
          // fallback
        }
      }
    }
    setFormData(profile);
  }, [open]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    updateProfile(formData);
    toast.success("Profile updated successfully!");
    onOpenChange(false);
  };

  const handleClearData = async (target: string, label: string) => {
    if (!confirm(`Are you sure you want to clear ${label}? This will remove dummy data so you can start with a fresh slate.`)) {
      return;
    }

    setIsResetting(true);
    try {
      await clearData(target);
      toast.success(`${label} cleared. Fresh slate ready!`);
    } catch {
      toast.error("Failed to clear data.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            Student Profile & Data Settings
          </DialogTitle>
          <DialogDescription className="text-xs">
            Personalize Lumina with your real academic details and manage your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Profile Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="prof-name" className="text-xs font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" /> Your Name
              </Label>
              <Input
                id="prof-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Sharma"
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="prof-branch" className="text-xs font-medium flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> Branch / Major
                </Label>
                <Input
                  id="prof-branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Computer Engg"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prof-sem" className="text-xs font-medium flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" /> Semester
                </Label>
                <Input
                  id="prof-sem"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  placeholder="e.g. Sem 5"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="prof-college" className="text-xs font-medium flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-muted-foreground" /> College / Institute
              </Label>
              <Input
                id="prof-college"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="e.g. National Institute of Technology"
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Clean Slate / Reset Data Section */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Reset Demo Data (Fresh Slate)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Clear mock tasks, demo expenses, or sample notes so you can use Lumina with your real college curriculum.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleClearData("expenses", "Expenses")}
                disabled={isResetting}
              >
                Clear Expenses
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleClearData("tasks", "Tasks")}
                disabled={isResetting}
              >
                Clear Tasks
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleClearData("all", "All Demo Data")}
                disabled={isResetting}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Reset All to Fresh Slate
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Save Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
