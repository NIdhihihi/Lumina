"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Code2, Pin, Copy, Check, Sparkles, FileCode } from "lucide-react";
import { toast } from "sonner";

export interface PasteboardSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  lastEditedBy: string;
  updatedAt: string;
  isPinned: boolean;
}

interface PasteboardProps {
  initialSnippet?: PasteboardSnippet | null;
  onPinSnippet: (snippet: PasteboardSnippet) => void;
  currentUser?: string;
}

const LANGUAGES = [
  { value: "verilog", label: "Verilog HDL" },
  { value: "cpp", label: "C++ (Data Structures)" },
  { value: "python", label: "Python (AI / Scripting)" },
  { value: "java", label: "Java (OOP)" },
  { value: "typescript", label: "TypeScript / JS" },
];

export function Pasteboard({
  initialSnippet,
  onPinSnippet,
  currentUser = "Renee",
}: PasteboardProps) {
  const [snippet, setSnippet] = useState<PasteboardSnippet>(
    initialSnippet || {
      id: "snippet-1",
      title: "half_adder.v",
      language: "verilog",
      code: `// 1-bit Half Adder Circuit in Verilog
module half_adder (
    input  wire a,
    input  wire b,
    output wire sum,
    output wire carry
);
    // Continuous logic assignments
    assign sum   = a ^ b;
    assign carry = a & b;
endmodule`,
      lastEditedBy: currentUser,
      updatedAt: new Date().toISOString(),
      isPinned: true,
    }
  );

  const [copied, setCopied] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSnippet((prev) => ({
      ...prev,
      code: e.target.value,
      lastEditedBy: currentUser,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSnippet((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    toast.success("Snippet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePin = () => {
    const updated = {
      ...snippet,
      lastEditedBy: currentUser,
      updatedAt: new Date().toISOString(),
      isPinned: true,
    };
    onPinSnippet(updated);
    toast.success(`Pinned "${snippet.title}" to group chat discussion!`);
  };

  const lineCount = snippet.code.split("\n").length;

  return (
    <Card className="border flex flex-col h-full">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            Live Collaborative Pasteboard
          </CardTitle>
          <CardDescription className="text-xs">
            Pinned code workspace for group labs & algorithm assignments.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs h-8">
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="sm" onClick={handlePin} className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white">
            <Pin className="w-3.5 h-3.5 mr-1" /> Pin to Chat
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Subheader bar with title and language selector */}
        <div className="p-2 border-b bg-accent/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <FileCode className="w-4 h-4 text-muted-foreground" />
            <Input
              value={snippet.title}
              onChange={handleTitleChange}
              placeholder="Snippet title (e.g. half_adder.v)"
              className="h-7 text-xs font-semibold bg-background max-w-[240px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={snippet.language}
              onValueChange={(val) => setSnippet((prev) => ({ ...prev, language: val }))}
            >
              <SelectTrigger className="h-7 text-xs w-36 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Edited by <strong className="text-foreground">{snippet.lastEditedBy}</strong>
            </span>
          </div>
        </div>

        {/* Code Editor Area with Line Numbers */}
        <div className="flex-1 flex min-h-[340px] font-mono text-xs bg-muted/40">
          <div className="w-10 p-3 select-none text-right text-muted-foreground/60 border-r border-border font-mono text-[11px] leading-relaxed">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={snippet.code}
            onChange={handleCodeChange}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent resize-none outline-none font-mono text-xs leading-relaxed text-foreground"
            placeholder="Type or drop code snippet here..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
