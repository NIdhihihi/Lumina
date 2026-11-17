"use client";

import { useState, useEffect } from "react";
import { Plus, Check, X, Trash2, Calendar as CalendarIcon, AlertTriangle, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const { attendance, fetchAttendance } = useLuminaStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubject }),
      });
      if (res.ok) {
        toast.success("Subject added");
        setIsAdding(false);
        setNewSubject("");
        fetchAttendance();
      }
    } catch (error) {
      toast.error("Failed to add subject");
    }
  };

  const updateAttendance = async (subject: any, attendedInc: number, totalInc: number) => {
    const updated = {
      ...subject,
      attended: Math.max(0, subject.attended + attendedInc),
      total: Math.max(0, subject.total + totalInc),
    };
    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) fetchAttendance();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Subject deleted");
        fetchAttendance();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const calculateBunks = (attended: number, total: number) => {
    if (total === 0) return { percent: 0, safeBunks: 0 };
    const percent = (attended / total) * 100;
    
    // Formula for safe bunks: (Attended / 0.75) - Total
    const safeBunks = Math.floor(attended / 0.75 - total);
    return { percent, safeBunks: Math.max(0, safeBunks) };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Tracker</h2>
          <p className="text-muted-foreground">Keep your attendance above 75% threshold.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subject</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="Subject Name" 
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAddSubject}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {(Array.isArray(attendance) ? attendance : []).map((subject) => {
          const { percent, safeBunks } = calculateBunks(subject.attended, subject.total);
          const isDanger = percent < 75 && subject.total > 0;

          return (
            <Card key={subject.id} className={cn("overflow-hidden border-2", isDanger ? "border-destructive/50" : "border-border")}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                    <CardDescription>{subject.attended} / {subject.total} classes</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Attendance Rate</span>
                    <span className={cn(isDanger ? "text-destructive" : "text-green-500")}>
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={percent} className={isDanger ? "bg-destructive/20 h-2" : "h-2"} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={cn("p-3 rounded-lg border flex flex-col items-center justify-center text-center", 
                    safeBunks > 0 ? "bg-green-500/10 border-green-500/20" : "bg-destructive/10 border-destructive/20")}>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Safe Bunks
                    </span>
                    <span className={cn("text-2xl font-bold", safeBunks > 0 ? "text-green-500" : "text-destructive")}>
                      {safeBunks}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => updateAttendance(subject, 1, 1)}>
                      <Check className="w-3 h-3 mr-2" /> Present
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-destructive" onClick={() => updateAttendance(subject, 0, 1)}>
                      <X className="w-3 h-3 mr-2" /> Absent
                    </Button>
                  </div>
                </div>

                {safeBunks > 2 && (
                  <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 p-2 rounded border border-green-500/20">
                    <Smile className="w-4 h-4 shrink-0" />
                    <span>Cooling Day! You can afford to take a break.</span>
                  </div>
                )}
                {isDanger && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Warning: Below threshold! No more bunks allowed.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
