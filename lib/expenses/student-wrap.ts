export interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  type: "good" | "bad";
  description?: string;
  title?: string;
  date: string;
}

export interface StudentWrapSummary {
  periodLabel: string;
  totalSpent: number;
  goodSpent: number;
  badSpent: number;
  goodRatioPercent: number;
  topCategory: { name: string; amount: number; percent: number };
  categoryBreakdown: { category: string; amount: number; percent: number }[];
  coolingDaySavings: number;
  personaBadge: {
    title: string;
    icon: string;
    description: string;
    colorClass: string;
  };
  wrapHighlight: string;
}

export function generateWeeklyStudentWrap(
  expenses: ExpenseRecord[],
  referenceDate: Date = new Date(),
  coolingDaysCount: number = 2
): StudentWrapSummary {
  if (expenses.length === 0) {
    return {
      periodLabel: "This Week",
      totalSpent: 0,
      goodSpent: 0,
      badSpent: 0,
      goodRatioPercent: 100,
      topCategory: { name: "None", amount: 0, percent: 0 },
      categoryBreakdown: [],
      coolingDaySavings: 0,
      personaBadge: {
        title: "Clean Slate Scholar",
        icon: "🌱",
        description: "Zero expenses recorded yet for this week.",
        colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      },
      wrapHighlight: "Log your first daily expense to unlock your student financial digest!",
    };
  }

  const totalSpent = Math.round(expenses.reduce((sum, e) => sum + e.amount, 0));
  const goodSpent = Math.round(
    expenses.filter((e) => e.type === "good").reduce((sum, e) => sum + e.amount, 0)
  );
  const badSpent = totalSpent - goodSpent;
  const goodRatioPercent = totalSpent > 0 ? Math.round((goodSpent / totalSpent) * 100) : 0;

  // Category breakdown
  const catMap: Record<string, number> = {};
  expenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  });

  const categoryBreakdown = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown[0] || { name: "General", amount: totalSpent, percent: 100 };

  // Estimate Cooling Day Savings (staying home/campus saves ~₹150 in transit & outside meals per cooling day)
  const coolingDaySavings = coolingDaysCount * 150;

  // Determine Personalized Student Persona Badge
  let personaBadge = {
    title: "Caffeine & Midnight Crammer",
    icon: "☕",
    description: "Late night study sessions fueled by snacks and coffee. Keep an eye on impulse buys!",
    colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  if (goodRatioPercent >= 65) {
    personaBadge = {
      title: "Frugal Scholar",
      icon: "🏆",
      description: `Disciplined budgeter! ${goodRatioPercent}% of your spending went toward essential academic investments & campus necessities.`,
      colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };
  } else if ((catMap["Food"] || 0) / (totalSpent || 1) >= 0.45) {
    personaBadge = {
      title: "Canteen VIP",
      icon: "🥪",
      description: "Mess and canteen meals were your top priority. You stayed nourished through long lab sessions!",
      colorClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };
  }

  const wrapHighlight = `You spent ₹${totalSpent} this week across ${expenses.length} transactions, investing ${goodRatioPercent}% in productive essentials while preserving ~₹${coolingDaySavings} through cooling day breaks.`;

  return {
    periodLabel: "Weekly Student Wrap",
    totalSpent,
    goodSpent,
    badSpent,
    goodRatioPercent,
    topCategory: { name: topCategory.category, amount: topCategory.amount, percent: topCategory.percent },
    categoryBreakdown,
    coolingDaySavings,
    personaBadge,
    wrapHighlight,
  };
}
