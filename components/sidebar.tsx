"use client";

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
  CheckSquare 
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
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

  return (
    <div className="w-64 bg-card border-r flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          LUMINA
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
              pathname === item.href 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
