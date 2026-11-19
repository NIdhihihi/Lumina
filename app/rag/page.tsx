"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Send, User, Bot, Loader2, Notebook, ShieldCheck, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const searchParams = useSearchParams();
  const { notes, chatHistory, fetchChatHistory, fetchNotes } = useLuminaStore();
  const safeNotes = Array.isArray(notes) ? notes : [];
  const safeChatHistory = Array.isArray(chatHistory) ? chatHistory : [];
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialPromptSent = useRef(false);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    fetchChatHistory();
    fetchNotes();
    fetch("/api/ai/index", { method: "POST" }).catch(() => undefined);
  }, []);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    userScrolledUp.current = !isNearBottom;
    setShowScrollBottom(!isNearBottom);
  };

  useEffect(() => {
    const promptParam = searchParams.get("prompt");
    if (promptParam && !initialPromptSent.current) {
      initialPromptSent.current = true;
      handleSend(promptParam);
    }
  }, [searchParams]);

  // Only scroll down automatically if the user is already near the bottom
  useEffect(() => {
    if (!userScrolledUp.current) {
      scrollToBottom(false);
    }
  }, [chatHistory, isLoading]);

  const handleSend = async (value?: string) => {
    const prompt = (value ?? input).trim();
    if (!prompt || isLoading) return;

    setInput("");
    setIsLoading(true);
    userScrolledUp.current = false;
    setTimeout(() => scrollToBottom(true), 50);

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

      await fetchChatHistory();
      if (!userScrolledUp.current) {
        setTimeout(() => scrollToBottom(true), 100);
      }
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
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-h-[calc(100vh-5.5rem)] space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Offline Second Brain (RAG)</h2>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 gap-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              TensorFlow.js Active
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            On-device semantic search over textbooks and notes. Works 100% offline in college basements.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent px-3 py-1.5 rounded-full w-fit shrink-0">
          <Notebook className="w-3.5 h-3.5 text-primary" />
          <span>{safeNotes.length} textbooks & notes indexed locally</span>
        </div>
      </div>

      <div className="shrink-0">
        <AIRecommendation recommendation={latestRecommendation} />
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2.5"
            onClick={() => handleSend(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>

      {/* Chat Display Container */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden border shadow-sm">
        <CardContent className="flex-1 min-h-0 p-0 flex flex-col relative">
          {/* Scrollable messages viewport */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6"
          >
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
          </div>

          {/* Floating Jump to Latest Button */}
          {showScrollBottom && (
            <div className="absolute bottom-3 right-5 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  userScrolledUp.current = false;
                  scrollToBottom(true);
                }}
                className="shadow-md text-xs h-7 px-2.5 gap-1.5 border bg-background/90 backdrop-blur hover:bg-accent"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                Jump to latest
              </Button>
            </div>
          )}

          {/* Bottom Chat Input */}
          <div className="p-3 sm:p-4 border-t bg-card shrink-0">
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
