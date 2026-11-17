"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Zap, Trophy, Flame, ShieldAlert, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { toast } from "sonner";

interface SquadMember {
  id: string;
  name: string;
  avatar: string;
  flowScore: number;
  streakDays: number;
  status: "deep_flow" | "studying" | "context_switching";
  cognitiveDebt: number;
}

const INITIAL_SQUADS = [
  { id: "squad-1", name: "Gate 2027 CSE", subject: "Computer Science" },
  { id: "squad-2", name: "Finals Grind Squad", subject: "Semester 5" },
  { id: "squad-3", name: "Late Night TOC & Algorithms", subject: "Theory of Computation" },
];

const INITIAL_MEMBERS: SquadMember[] = [
  { id: "you", name: "You", avatar: "🦊", flowScore: 85, streakDays: 5, status: "deep_flow", cognitiveDebt: 15 },
  { id: "m-1", name: "Priya (Anon #1)", avatar: "🐼", flowScore: 92, streakDays: 12, status: "deep_flow", cognitiveDebt: 8 },
  { id: "m-2", name: "Rahul (Anon #2)", avatar: "🐸", flowScore: 74, streakDays: 3, status: "studying", cognitiveDebt: 26 },
  { id: "m-3", name: "Sneha (Anon #3)", avatar: "🦋", flowScore: 68, streakDays: 2, status: "studying", cognitiveDebt: 32 },
  { id: "m-4", name: "Arjun (Anon #4)", avatar: "🦁", flowScore: 45, streakDays: 0, status: "context_switching", cognitiveDebt: 55 },
];

// Anonymized flow timeline over the last 4 hours
const FLOW_TIMELINE_DATA = [
  { time: "18:00", You: 60, Priya: 85, Rahul: 70, Sneha: 55, Arjun: 40 },
  { time: "18:30", You: 75, Priya: 88, Rahul: 72, Sneha: 60, Arjun: 35 },
  { time: "19:00", You: 70, Priya: 90, Rahul: 65, Sneha: 62, Arjun: 50 },
  { time: "19:30", You: 82, Priya: 92, Rahul: 68, Sneha: 65, Arjun: 45 },
  { time: "20:00", You: 88, Priya: 95, Rahul: 74, Sneha: 68, Arjun: 42 },
  { time: "20:30", You: 85, Priya: 92, Rahul: 74, Sneha: 68, Arjun: 45 },
];

export function StudySquads({ userFlowScore }: { userFlowScore: number }) {
  const [selectedSquad, setSelectedSquad] = useState(INITIAL_SQUADS[0]);
  const [joinCode, setJoinCode] = useState("");

  const members = INITIAL_MEMBERS.map((m) =>
    m.id === "you" ? { ...m, flowScore: userFlowScore, cognitiveDebt: Math.max(0, 100 - userFlowScore) } : m
  ).sort((a, b) => b.flowScore - a.flowScore);

  const deepFlowCount = members.filter((m) => m.flowScore >= 80).length;

  const handleJoinSquad = () => {
    if (!joinCode.trim()) return;
    toast.success(`Joined Study Squad "${joinCode.toUpperCase()}"! Synchronizing flow state...`);
    setJoinCode("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">{selectedSquad.name}</h3>
            <Badge variant="outline" className="text-xs">
              {selectedSquad.subject}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sharing anonymized flow graphs to generate healthy social focus pressure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter Squad Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="h-8 text-xs w-36"
          />
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleJoinSquad}>
            Join Squad
          </Button>
        </div>
      </div>

      <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500 shrink-0" />
          <span>
            <strong>Social Focus Pressure:</strong> {deepFlowCount} of {members.length} members are locked in Deep Flow.
          </span>
        </div>
        <span className="font-semibold text-blue-500">Live Pulse Syncing</span>
      </div>

      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Anonymized Squad Flow Graphs</CardTitle>
          <CardDescription className="text-xs">
            Real-time collective focus curves over the session.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FLOW_TIMELINE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="flowYou" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="flowPriya" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="You" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#flowYou)" />
              <Area type="monotone" dataKey="Priya" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#flowPriya)" />
              <Area type="monotone" dataKey="Rahul" stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="Sneha" stroke="#8b5cf6" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Squad Deep Work Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member, index) => {
              const isYou = member.id === "you";

              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isYou ? "bg-primary/10 border-primary/40 font-medium" : "bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold w-4 text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-xl">{member.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{member.name}</span>
                        {isYou && <Badge className="text-[10px] h-4">You</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" /> {member.streakDays} day streak
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-bold block">{member.flowScore}%</span>
                      <span className="text-[10px] text-muted-foreground">
                        Debt: {member.cognitiveDebt}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        member.flowScore >= 80
                          ? "text-green-500 border-green-500/30"
                          : member.flowScore >= 50
                          ? "text-amber-500 border-amber-500/30"
                          : "text-destructive border-destructive/30"
                      }`}
                    >
                      {member.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
