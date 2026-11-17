"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Pin, 
  Trash2, 
  Move, 
  Plus, 
  Sparkles, 
  RotateCcw,
  Cpu,
  Share2
} from "lucide-react";
import { toast } from "sonner";

export interface GateNode {
  id: string;
  type: "AND" | "OR" | "NOT" | "XOR" | "NAND";
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface WireConnection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

interface WhiteboardProps {
  initialGates?: GateNode[];
  onPinToChat: (circuitData: any) => void;
  currentUser?: string;
}

const GATE_TYPES: { type: GateNode["type"]; label: string; color: string }[] = [
  { type: "AND", label: "AND Gate", color: "#10b981" },
  { type: "OR", label: "OR Gate", color: "#3b82f6" },
  { type: "XOR", label: "XOR Gate", color: "#8b5cf6" },
  { type: "NOT", label: "NOT Gate", color: "#f59e0b" },
  { type: "NAND", label: "NAND Gate", color: "#ef4444" },
];

export function Whiteboard({ initialGates, onPinToChat, currentUser = "Renee" }: WhiteboardProps) {
  const [gates, setGates] = useState<GateNode[]>(
    initialGates || [
      { id: "g-1", type: "XOR", x: 120, y: 70, label: "Sum (A ⊕ B)", color: "#8b5cf6" },
      { id: "g-2", type: "AND", x: 120, y: 200, label: "Carry (A · B)", color: "#10b981" },
    ]
  );

  const [activeTool, setActiveTool] = useState<"select" | "wire">("select");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedGate, setSelectedGate] = useState<string | null>(null);

  const handleAddGate = (type: GateNode["type"], color: string) => {
    const newGate: GateNode = {
      id: `gate-${Date.now()}`,
      type,
      x: 180 + Math.random() * 60,
      y: 120 + Math.random() * 60,
      label: `${type} Gate`,
      color,
    };
    setGates((prev) => [...prev, newGate]);
    toast.success(`Placed ${type} logic gate on whiteboard.`);
  };

  const handleMouseDown = (e: React.MouseEvent, gateId: string) => {
    e.stopPropagation();
    const gate = gates.find((g) => g.id === gateId);
    if (!gate) return;

    setDraggingId(gateId);
    setSelectedGate(gateId);
    setDragOffset({
      x: e.clientX - gate.x,
      y: e.clientY - gate.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    setGates((prev) =>
      prev.map((g) =>
        g.id === draggingId
          ? {
              ...g,
              x: Math.max(20, Math.min(600, e.clientX - dragOffset.x)),
              y: Math.max(20, Math.min(360, e.clientY - dragOffset.y)),
            }
          : g
      )
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedGate) return;
    setGates((prev) => prev.filter((g) => g.id !== selectedGate));
    setSelectedGate(null);
    toast.info("Deleted gate from circuit.");
  };

  const handleReset = () => {
    setGates([]);
    setSelectedGate(null);
  };

  const handlePin = () => {
    onPinToChat({
      gates,
      pinnedAt: new Date().toISOString(),
      pinnedBy: currentUser,
      title: "Shared Logic Gate Circuit",
    });
    toast.success("Logic Gate circuit pinned to group discussion!");
  };

  // Render SVG Symbol for each logic gate
  const renderGateShape = (gate: GateNode) => {
    const isSelected = selectedGate === gate.id;

    return (
      <g
        key={gate.id}
        transform={`translate(${gate.x}, ${gate.y})`}
        onMouseDown={(e) => handleMouseDown(e, gate.id)}
        className="cursor-grab active:cursor-grabbing select-none"
      >
        {/* Selection glow */}
        {isSelected && (
          <rect
            x="-8"
            y="-8"
            width="116"
            height="76"
            rx="8"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        )}

        {/* Gate Background Box */}
        <rect
          x="0"
          y="0"
          width="100"
          height="60"
          rx="6"
          fill="hsl(var(--card))"
          stroke={gate.color}
          strokeWidth="2"
        />

        {/* Input Pins */}
        <line x1="-15" y1="18" x2="0" y2="18" stroke="#64748b" strokeWidth="2" />
        <circle cx="-15" cy="18" r="2.5" fill="#64748b" />
        <line x1="-15" y1="42" x2="0" y2="42" stroke="#64748b" strokeWidth="2" />
        <circle cx="-15" cy="42" r="2.5" fill="#64748b" />

        {/* Output Pin */}
        <line x1="100" y1="30" x2="115" y2="30" stroke="#64748b" strokeWidth="2" />
        <circle cx="115" cy="30" r="2.5" fill="#64748b" />

        {/* Gate Type Badge */}
        <text
          x="50"
          y="28"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill={gate.color}
          className="font-mono"
        >
          {gate.type}
        </text>

        {/* Gate Subtitle / Expression */}
        <text
          x="50"
          y="46"
          textAnchor="middle"
          fontSize="9.5"
          fill="currentColor"
          className="text-muted-foreground font-mono"
        >
          {gate.label}
        </text>
      </g>
    );
  };

  return (
    <Card className="border flex flex-col h-full">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Collaborative Logic Gate Whiteboard
          </CardTitle>
          <CardDescription className="text-xs">
            Sketch digital logic circuits live with your study group.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {selectedGate && (
            <Button variant="ghost" size="sm" onClick={handleDeleteSelected} className="text-xs text-destructive h-8">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Gate
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} className="text-xs h-8">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
          <Button size="sm" onClick={handlePin} className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white">
            <Pin className="w-3.5 h-3.5 mr-1" /> Pin to Chat
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-2 border-b bg-accent/20 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Add Logic Gate:</span>
          {GATE_TYPES.map((g) => (
            <Button
              key={g.type}
              size="sm"
              variant="outline"
              className="h-7 text-xs font-mono font-bold"
              style={{ borderColor: `${g.color}50`, color: g.color }}
              onClick={() => handleAddGate(g.type, g.color)}
            >
              <Plus className="w-3 h-3 mr-1" /> {g.type}
            </Button>
          ))}
          <Badge variant="outline" className="text-[10px] ml-auto text-muted-foreground">
            {gates.length} gates on board
          </Badge>
        </div>

        {/* SVG Drawing Canvas */}
        <div
          className="flex-1 min-h-[360px] relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="w-full h-full min-h-[360px]">
            {/* Guide connection wires between first two gates if present */}
            {gates.length >= 2 && (
              <path
                d={`M ${gates[0].x + 100} ${gates[0].y + 30} C ${gates[0].x + 140} ${gates[0].y + 30}, ${
                  gates[1].x - 40
                } ${gates[1].y + 18}, ${gates[1].x} ${gates[1].y + 18}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            )}

            {gates.map(renderGateShape)}
          </svg>

          {gates.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground pointer-events-none">
              <Cpu className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">Whiteboard Canvas Empty</p>
              <p className="text-xs">Click any gate button above to place AND, OR, XOR, or NOT gates.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
