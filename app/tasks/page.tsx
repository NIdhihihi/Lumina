"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Target, 
  Users, 
  Layers, 
  ArrowRight, 
  Sparkles,
  Zap,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

const COLUMNS = [
  {
    id: "want_to_do",
    label: "What I Want to Do",
    subtitle: "Bridging goals to execution",
    icon: Target,
    color: "text-blue-500",
    bgClass: "border-blue-500/20 bg-blue-500/5",
    badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    id: "doing",
    label: "What I am Doing",
    subtitle: "Active daily execution",
    icon: Zap,
    color: "text-amber-500",
    bgClass: "border-amber-500/20 bg-amber-500/5",
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    id: "done",
    label: "Completed",
    subtitle: "Delivered & verified",
    icon: CheckCircle2,
    color: "text-green-500",
    bgClass: "border-green-500/20 bg-green-500/5",
    badgeClass: "bg-green-500/10 text-green-500 border-green-500/20",
  },
];

const DEFAULT_PROJECTS = [
  "Digital Systems Lab",
  "SE Project Phase 2",
  "Coursework Sprint",
];

export default function TasksPage() {
  const { tasks, fetchTasks, profile } = useLuminaStore();
  const primaryName = profile.name || "You";

  const teamMembers = [
    { name: primaryName, avatar: "👤" },
    ...[
      { name: "Alex", avatar: "👨‍💻" },
      { name: "Priya", avatar: "👩‍💻" },
    ].filter((m) => m.name.toLowerCase() !== primaryName.toLowerCase()),
  ];

  const [isAdding, setIsAdding] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "want_to_do" as "want_to_do" | "doing" | "done",
    priority: "medium" as "low" | "medium" | "high",
    projectName: "Digital Systems Lab",
    phase: "Phase 2: Logic Synthesis",
    assigneeName: primaryName,
    dueDate: "",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const safeTasks: Task[] = Array.isArray(tasks) ? tasks : [];

  // Build unique assignee options from both team roster and existing task records
  const filterAssigneeMap = new Map<string, string>();
  teamMembers.forEach((m) => filterAssigneeMap.set(m.name, m.avatar));
  safeTasks.forEach((t) => {
    if (t.assignee?.name && !filterAssigneeMap.has(t.assignee.name)) {
      filterAssigneeMap.set(t.assignee.name, t.assignee.avatar || "👤");
    }
  });
  const filterAssigneeOptions = Array.from(filterAssigneeMap.entries()).map(([name, avatar]) => ({
    name,
    avatar,
  }));

  // Filter tasks by project and assignee
  const filteredTasks = safeTasks.filter((t) => {
    const matchesProject =
      selectedProject === "all" || (t.projectName && t.projectName === selectedProject);
    const matchesMember =
      selectedMember === "all" || (t.assignee && t.assignee.name === selectedMember);
    return matchesProject && matchesMember;
  });

  // Calculate Progress Engine metrics for selected project
  const projectTasks =
    selectedProject === "all"
      ? safeTasks
      : safeTasks.filter((t) => t.projectName === selectedProject);

  const completedCount = projectTasks.filter((t) => t.status === "done").length;
  const progressPercent =
    projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    const assignee = teamMembers.find((m) => m.name === newTask.assigneeName) || {
      name: primaryName,
      avatar: "👤",
    };

    const taskPayload = {
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      status: newTask.status,
      priority: newTask.priority,
      projectName: newTask.projectName,
      phase: newTask.phase,
      assignee,
      dueDate: newTask.dueDate || undefined,
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskPayload),
      });

      if (res.ok) {
        toast.success(`Task added to ${newTask.status === "doing" ? "What I am Doing" : "What I Want to Do"}!`);
        setIsAdding(false);
        setNewTask({
          title: "",
          description: "",
          status: "want_to_do",
          priority: "medium",
          projectName: "Digital Systems Lab",
          phase: "Phase 2: Logic Synthesis",
          assigneeName: "Renee",
          dueDate: "",
        });
        fetchTasks();
      }
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleUpdateStatus = async (task: Task, newStatus: "want_to_do" | "doing" | "done") => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });

      if (res.ok) {
        const statusLabel =
          newStatus === "doing"
            ? "What I am Doing"
            : newStatus === "want_to_do"
            ? "What I Want to Do"
            : "Completed";
        toast.success(`Moved to "${statusLabel}"`);
        fetchTasks();
      }
    } catch {
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Task deleted");
        fetchTasks();
      }
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Multi-User Kanban & Progress Engine</h2>
            <Badge variant="outline" className="text-xs text-blue-500 border-blue-500/30">
              Team Alignment
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Categorize tasks into <strong>What I am Doing</strong> and <strong>What I Want to Do</strong> to bridge goals with daily execution.
          </p>
        </div>

        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New Team Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold">Task Title</label>
                <Input
                  placeholder="e.g. Synthesize 4-Bit ALU in Verilog"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold">Description</label>
                <Input
                  placeholder="Details, circuit components, or report sections"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold">Category / Column</label>
                  <Select
                    value={newTask.status}
                    onValueChange={(val) => setNewTask({ ...newTask, status: val as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="want_to_do">What I Want to Do</SelectItem>
                      <SelectItem value="doing">What I am Doing</SelectItem>
                      <SelectItem value="done">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Priority</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(val) => setNewTask({ ...newTask, priority: val as any })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold">Project Name</label>
                  <Input
                    placeholder="e.g. Digital Systems Lab"
                    value={newTask.projectName}
                    onChange={(e) => setNewTask({ ...newTask, projectName: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Project Phase</label>
                  <Input
                    placeholder="e.g. Phase 2: Logic Synthesis"
                    value={newTask.phase}
                    onChange={(e) => setNewTask({ ...newTask, phase: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold">Assignee</label>
                  <Select
                    value={newTask.assigneeName}
                    onValueChange={(val) => setNewTask({ ...newTask, assigneeName: val })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.name} value={m.name}>
                          {m.avatar} {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold">Due Date</label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" onClick={handleAddTask}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Engine & Project Alignment Bar */}
      <Card className="border">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Team Project Alignment:{" "}
                <span className="text-foreground font-bold">
                  {selectedProject === "all" ? "All Shared Projects" : selectedProject}
                </span>
              </span>
              <span className="text-xs font-mono font-bold text-primary">
                {completedCount}/{projectTasks.length} ({progressPercent}%)
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Project & Assignee Filters */}
          <div className="flex items-center gap-2 shrink-0">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="Filter by Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {DEFAULT_PROJECTS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="h-8 text-xs w-36">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {filterAssigneeOptions.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.avatar} {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 3-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => {
            if (col.id === "want_to_do") {
              return t.status === "want_to_do" || t.status === "todo";
            }
            return t.status === col.id;
          });

          return (
            <div key={col.id} className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-card border">
                <div className="flex items-center gap-2">
                  <col.icon className={cn("w-4 h-4", col.color)} />
                  <div>
                    <h3 className="font-semibold text-sm leading-none">{col.label}</h3>
                    <span className="text-[10px] text-muted-foreground">{col.subtitle}</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-xs font-mono font-bold", col.badgeClass)}>
                  {colTasks.length}
                </Badge>
              </div>

              {/* Tasks Dropping / Listing Area */}
              <div className="space-y-3 min-h-[460px] p-2 rounded-xl bg-accent/20 border border-dashed">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-muted-foreground p-4">
                    <p className="font-medium">No tasks in this lane</p>
                    <p className="text-[11px] opacity-70">
                      {col.id === "want_to_do"
                        ? "Add milestone goals above"
                        : col.id === "doing"
                        ? "Promote a goal to start execution"
                        : "Completed deliverables will appear here"}
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="group transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <CardHeader className="p-3.5 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold leading-tight">
                            {task.title}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        {task.description && (
                          <CardDescription className="text-xs mt-1 line-clamp-2">
                            {task.description}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="p-3.5 pt-0 space-y-2.5">
                        {/* Project & Phase Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {task.projectName && (
                            <Badge variant="secondary" className="text-[9px] font-medium">
                              {task.projectName}
                            </Badge>
                          )}
                          {task.phase && (
                            <Badge variant="outline" className="text-[9px] text-muted-foreground">
                              {task.phase}
                            </Badge>
                          )}
                        </div>

                        {/* Assignee & Due Date Row */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-sm">{task.assignee?.avatar || "👤"}</span>
                            <span className="text-foreground">{task.assignee?.name || "Renee"}</span>
                          </div>

                          {task.dueDate && (
                            <span
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-mono",
                                task.priority === "high" ? "text-destructive font-bold" : ""
                              )}
                            >
                              <Clock className="w-3 h-3" /> Due {task.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Status Transition Action Buttons */}
                        <div className="pt-2 flex items-center justify-between gap-1">
                          {col.id === "want_to_do" && (
                            <Button
                              size="sm"
                              className="w-full text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                              onClick={() => handleUpdateStatus(task, "doing")}
                            >
                              <Zap className="w-3 h-3 mr-1" /> Start Doing
                            </Button>
                          )}

                          {col.id === "doing" && (
                            <div className="flex items-center gap-1 w-full">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-[10px] h-7"
                                onClick={() => handleUpdateStatus(task, "want_to_do")}
                              >
                                🎯 Goals
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 text-[10px] h-7 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleUpdateStatus(task, "done")}
                              >
                                ✅ Complete
                              </Button>
                            </div>
                          )}

                          {col.id === "done" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full text-[10px] h-6 text-muted-foreground hover:text-foreground"
                              onClick={() => handleUpdateStatus(task, "doing")}
                            >
                              Reopen to Doing ⚡
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
