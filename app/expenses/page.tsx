"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Wallet,
  Zap,
  Coffee,
  Sparkles,
  BookOpen,
  Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { WeeklyStudentWrapModal } from "@/components/expenses/weekly-student-wrap-modal";
import type { Expense } from "@/lib/types";

const CATEGORIES = ["Food", "Transport", "Study", "Entertainment", "Other"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const RAPID_PRESETS = [
  { label: "+₹30 Chai", title: "Cutting Chai", amount: 30, category: "Food", type: "bad" as const, icon: "☕" },
  { label: "+₹80 Canteen Lunch", title: "Canteen Thali", amount: 80, category: "Food", type: "good" as const, icon: "🥪" },
  { label: "+₹45 Lab Printouts", title: "Lab Manual Xerox", amount: 45, category: "Study", type: "good" as const, icon: "📄" },
  { label: "+₹40 Metro / Auto", title: "Shared Auto", amount: 40, category: "Transport", type: "good" as const, icon: "🛺" },
  { label: "+₹120 Night Snacks", title: "Late Night Snack", amount: 120, category: "Entertainment", type: "bad" as const, icon: "🍟" },
];

export default function ExpensesPage() {
  const { expenses, fetchExpenses } = useLuminaStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({ 
    title: "", 
    amount: "", 
    category: "Food", 
    type: "good" as "good" | "bad" 
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const safeExpenses: Expense[] = Array.isArray(expenses) ? expenses : [];

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          date: new Date().toISOString().split("T")[0]
        }),
      });
      if (res.ok) {
        toast.success("Expense added");
        setIsAdding(false);
        setNewExpense({ title: "", amount: "", category: "Food", type: "good" });
        fetchExpenses();
      }
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const handleQuickAdd = async (preset: typeof RAPID_PRESETS[0]) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: preset.title,
          amount: preset.amount,
          category: preset.category,
          type: preset.type,
          date: new Date().toISOString().split("T")[0]
        }),
      });
      if (res.ok) {
        toast.success(`Logged ${preset.title} (₹${preset.amount}) in 1 tap!`);
        fetchExpenses();
      }
    } catch {
      toast.error("Failed to log preset expense");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Expense deleted");
        fetchExpenses();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const totalAmount = safeExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const chartData = CATEGORIES.map((cat) => ({
    name: cat,
    value: safeExpenses
      .filter((e) => e.category === cat)
      .reduce((acc, curr) => acc + curr.amount, 0),
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Frictionless Expense Logger</h2>
          <p className="text-muted-foreground">Rapid-entry for student daily spends with Weekly Student Wrap.</p>
        </div>

        <div className="flex items-center gap-2">
          <WeeklyStudentWrapModal expenses={safeExpenses} />

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Custom Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold">Title</label>
                  <Input 
                    placeholder="e.g. Canteen Lunch" 
                    value={newExpense.title}
                    onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold">Amount (₹)</label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold">Category</label>
                    <Select 
                      value={newExpense.category} 
                      onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold">Spending Type</label>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant={newExpense.type === "good" ? "default" : "outline"}
                      className="flex-1 text-xs h-8"
                      onClick={() => setNewExpense({ ...newExpense, type: "good" })}
                    >
                      <TrendingDown className="w-3.5 h-3.5 mr-1 text-green-500" /> Good (Investment)
                    </Button>
                    <Button 
                      type="button"
                      variant={newExpense.type === "bad" ? "default" : "outline"}
                      className="flex-1 text-xs h-8"
                      onClick={() => setNewExpense({ ...newExpense, type: "bad" })}
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1 text-destructive" /> Bad (Impulse)
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button size="sm" onClick={handleAddExpense}>Save Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rapid-Entry Preset Chips */}
      <Card className="border">
        <CardContent className="p-3.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Rapid 1-Tap Log:
          </span>
          {RAPID_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(preset)}
              className="h-7 text-xs hover:border-primary/50 transition-all font-medium"
            >
              <span className="mr-1">{preset.icon}</span> {preset.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Transactions List */}
        <Card className="md:col-span-2 border">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                <CardDescription className="text-xs">Logged student spends and daily investments.</CardDescription>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                {safeExpenses.length} transactions
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {safeExpenses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg border-dashed bg-accent/10">
                  <Wallet className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No expenses recorded yet.</p>
                  <p className="text-xs text-muted-foreground">Use the rapid-entry buttons above to log your first spend.</p>
                </div>
              )}
              {safeExpenses.slice().reverse().map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", expense.type === "good" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive")}>
                      {expense.type === "good" ? (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{expense.description || "Expense"}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {expense.category} • {expense.date}
                        {expense.type === "good" ? " • Investment" : " • Impulse"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">₹{expense.amount}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" 
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget & Category Overview */}
        <Card className="border flex flex-col">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">Budget Overview</CardTitle>
            <CardDescription className="text-xs">Total Spent: <strong className="text-foreground font-mono">₹{totalAmount}</strong></CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] p-4 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${value}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground space-y-2">
                <PieChartIcon className="w-10 h-10 opacity-40" />
                <p>Log expenses to view category breakdown.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
