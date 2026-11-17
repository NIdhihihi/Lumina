"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingDown, TrendingUp } from "lucide-react";
import { useLuminaStore } from "@/hooks/use-lumina-store";

export function ExpenseWidget() {
  const { expenses } = useLuminaStore();

const safeExpenses = Array.isArray(expenses) ? expenses : [];

const total = safeExpenses.reduce(
  (acc, curr) => acc + (curr?.amount || 0),
  0
);

const badSpending = safeExpenses
  .filter((e) => e?.type === "bad")
  .reduce((acc, curr) => acc + (curr?.amount || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${total.toFixed(2)}</div>
        <div className="flex items-center gap-1 mt-1">
          {badSpending > 0 ? (
            <TrendingUp className="h-3 w-3 text-destructive" />
          ) : (
            <TrendingDown className="h-3 w-3 text-green-500" />
          )}
          <p className="text-[10px] text-muted-foreground">
            ${badSpending.toFixed(2)} on "bad" spending
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
