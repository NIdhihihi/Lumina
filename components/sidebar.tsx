"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BrainCircuit, 
  NotebookPen, 
  UserCheck, 
  Wallet, 
  Timer, 
  Calendar, 
  CheckSquare,
  MessageSquare,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { BatteryGuardianIndicator } from "@/components/battery/battery-guardian-indicator";
import { ProfileSettingsDialog } from "@/components/settings/profile-settings-dialog";
import { Button } from "@/components/ui/button";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: MessageSquare, label: "Discussion Hub", href: "/hub" },
  { icon: BrainCircuit, label: "AI Study", href: "/rag" },
  { icon: NotebookPen, label: "Notes", href: "/notes" },
  { icon: UserCheck, label: "Attendance", href: "/attendance" },
  { icon: Wallet, label: "Expenses", href: "/expenses" },
  { icon: Timer, label: "Focus", href: "/focus" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useLuminaStore();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  return (
    <div className="w-64 bg-card border-r flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          LUMINA
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
              pathname === item.href 
                ? "bg-primary/10 text-primary font-semibold" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer: Battery Guardian & Profile Settings */}
      <div className="p-4 border-t space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <BatteryGuardianIndicator />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowProfileDialog(true)}
            title="Profile Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowProfileDialog(true)}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-accent/30 hover:bg-accent/60 transition-colors text-left"
          title="Open Profile Settings"
        >
          <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {profile.name ? profile.name[0].toUpperCase() : "S"}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold truncate leading-tight text-foreground">{profile.name || "Student"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{profile.branch || "Computer Science"}</p>
          </div>
        </button>
      </div>

      <ProfileSettingsDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} />
    </div>
  );
}
