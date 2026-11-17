"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingDown, TrendingUp, PieChart as PieChartIcon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CATEGORIES = ["Food", "Transport", "Study", "Entertainment", "Other"];
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount)
        }),
      });
      if (res.ok) {
        toast.success("Expense added");
        setIsAdding(false);
        setNewExpense({ title: "", amount: "", category: "Food", type: "good" });
        fetchExpenses();
      }
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Expense deleted");
        fetchExpenses();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const chartData = CATEGORIES.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expense Tracker</h2>
          <p className="text-muted-foreground">Manage your budget and spending habits.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input 
                  placeholder="e.g. Lunch" 
                  value={newExpense.title}
                  onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={newExpense.category} 
                    onValueChange={v => setNewExpense({...newExpense, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Spending Type</label>
                <div className="flex gap-2">
                  <Button 
                    variant={newExpense.type === "good" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setNewExpense({...newExpense, type: "good"})}
                  >
                    <TrendingDown className="w-4 h-4 mr-2 text-green-500" /> Good
                  </Button>
                  <Button 
                    variant={newExpense.type === "bad" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setNewExpense({...newExpense, type: "bad"})}
                  >
                    <TrendingUp className="w-4 h-4 mr-2 text-destructive" /> Bad
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddExpense}>Save Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>A list of your latest transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
                  <Wallet className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
                </div>
              )}
              {expenses.slice().reverse().map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 group">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-full", expense.type === "good" ? "bg-green-500/20" : "bg-destructive/20")}>
                      {expense.type === "good" ? 
                        <TrendingDown className="w-4 h-4 text-green-500" /> : 
                        <TrendingUp className="w-4 h-4 text-destructive" />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-xs text-muted-foreground">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">${expense.amount.toFixed(2)}</span>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(expense.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>Total Spent: ${totalAmount.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <PieChartIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Add data to see chart</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
