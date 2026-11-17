"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Send, User, Bot, Loader2, Notebook, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { SourceCitation } from "@/components/ai/SourceCitation";
import { AIRecommendation } from "@/components/ai/AIRecommendation";
import { StudyPlan } from "@/components/ai/StudyPlan";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "What is the 75% attendance policy for exams?",
  "Explain the Pumping Lemma from my TOC notes",
  "How do Karnaugh Maps simplify logic circuits?",
  "Can I miss tomorrow's TOC lecture?",
  "Which tasks should I prioritize this week?",
];

function AIChatContent() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { notes, chatHistory, fetchChatHistory, fetchNotes } = useLuminaStore();
  const safeNotes = Array.isArray(notes) ? notes : [];
  const safeChatHistory = Array.isArray(chatHistory) ? chatHistory : [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialPromptSent = useRef(false);

  useEffect(() => {
    fetchChatHistory();
    fetchNotes();
    fetch("/api/ai/index", { method: "POST" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam && !initialPromptSent.current) {
      initialPromptSent.current = true;
      handleSend(promptParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isLoading]);

  const handleSend = async (value?: string) => {
    const prompt = (value ?? input).trim();
    if (!prompt || isLoading) return;

    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.error && data.aiUnavailable) {
        toast.error(data.error);
      }

      fetchChatHistory();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reach AI assistant";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const latestRecommendation = [...safeChatHistory]
    .reverse()
    .find((chat) => chat.recommendation)?.recommendation;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Offline Second Brain (RAG)</h2>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 gap-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              TensorFlow.js Active
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            On-device semantic search over textbooks and notes. Works 100% offline in college basements.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent px-3 py-1.5 rounded-full w-fit">
          <Notebook className="w-4 h-4 text-primary" />
          <span>{safeNotes.length} textbooks & notes indexed locally</span>
        </div>
      </div>

      <AIRecommendation recommendation={latestRecommendation} />

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => handleSend(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>

      {/* Chat Display */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {safeChatHistory.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Bot className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="font-semibold text-base">Local Second Brain Ready</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Ask questions about your uploaded textbook PDFs, attendance policies, or exam prep. All embeddings and searches run on-device via TensorFlow.js.
                  </p>
                </div>
              )}

              {safeChatHistory.map((chat) => (
                <div key={chat.id} className="space-y-4">
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[80%] text-sm shadow-sm">
                      {chat.prompt}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="max-w-[85%] space-y-2">
                      <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-none shadow-sm text-sm whitespace-pre-wrap leading-relaxed">
                        {chat.response}
                      </div>

                      {chat.sources?.length ? (
                        <div className="pt-1">
                          <SourceCitation sources={chat.sources} />
                        </div>
                      ) : null}

                      {chat.studyPlan ? <StudyPlan studyPlan={chat.studyPlan} /> : null}

                      {chat.taskPriorities?.length ? (
                        <div className="mt-2 space-y-2">
                          {chat.taskPriorities.map((task: any) => (
                            <div key={task.taskId} className="rounded-md border bg-background px-3 py-2 text-xs">
                              <div className="font-medium text-foreground">{task.title}</div>
                              <div className="text-muted-foreground mt-0.5">{task.reason}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-tl-none text-xs text-muted-foreground">
                    Searching local vector database (TensorFlow.js)...
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Ask about your textbook notes, attendance rules, or formulas..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="bg-background text-sm"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Offline Shield: Queries are resolved locally using on-device TensorFlow.js vector indexing.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AIChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Offline Second Brain...</div>}>
      <AIChatContent />
    </Suspense>
  );
}
