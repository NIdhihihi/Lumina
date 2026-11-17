"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUSES = [
  { id: "todo", label: "To Do", icon: Circle, color: "text-blue-500" },
  { id: "doing", label: "In Progress", icon: Clock, color: "text-amber-500" },
  { id: "done", label: "Completed", icon: CheckCircle2, color: "text-green-500" },
];

export default function TasksPage() {
  const { tasks, fetchTasks } = useLuminaStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.title) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        toast.success("Task created");
        setIsAdding(false);
        setNewTask({ title: "", description: "" });
        fetchTasks();
      }
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const updateStatus = async (task: any, status: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status }),
      });
      if (res.ok) fetchTasks();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Task deleted");
        fetchTasks();
      }
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task Board</h2>
          <p className="text-muted-foreground">Organize your academic workload with Kanban.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="Task title" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input 
                  placeholder="Optional details" 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTask}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATUSES.map((status) => (
          <div key={status.id} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <status.icon className={cn("w-4 h-4", status.color)} />
                <h3 className="font-semibold">{status.label}</h3>
                <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === status.id).length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[500px] p-2 rounded-lg bg-accent/30 border border-dashed">
              {tasks
                .filter((t) => t.status === status.id)
                .map((task) => (
                  <Card key={task.id} className="group cursor-grab active:cursor-grabbing">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex gap-1">
                        {STATUSES.filter(s => s.id !== status.id).map(s => (
                          <Button 
                            key={s.id} 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] px-2"
                            onClick={() => updateStatus(task, s.id)}
                          >
                            Move to {s.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
