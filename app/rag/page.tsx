"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Loader2, Notebook, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { SourceCitation } from "@/components/ai/SourceCitation";
import { AIRecommendation } from "@/components/ai/AIRecommendation";
import { StudyPlan } from "@/components/ai/StudyPlan";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Can I miss tomorrow's TOC lecture?",
  "What's the minimum attendance requirement?",
  "Create a study plan for my exams",
  "Which tasks should I prioritize this week?",
];

export default function AIChatPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { notes, chatHistory, fetchChatHistory, fetchNotes } = useLuminaStore();
  const safeNotes = Array.isArray(notes) ? notes : [];
  const safeChatHistory = Array.isArray(chatHistory) ? chatHistory : [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
    fetchNotes();
    fetch("/api/ai/index", { method: "POST" }).catch(() => undefined);
  }, []);

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
      if (data.error || data.aiUnavailable) {
        toast.error(data.error || data.response || "AI unavailable");
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Study Assistant</h2>
          <p className="text-muted-foreground">
            Context-aware academic copilot with attendance tools and document retrieval.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent px-3 py-1 rounded-full">
          <Notebook className="w-4 h-4" />
          {safeNotes.length} notes indexed
        </div>
      </div>

      <AIRecommendation recommendation={latestRecommendation} />

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Button key={prompt} variant="outline" size="sm" onClick={() => handleSend(prompt)}>
            {prompt}
          </Button>
        ))}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {safeChatHistory.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">No messages yet</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Ask about attendance, uploaded policies, study plans, or task priorities.
                  </p>
                </div>
              )}

              {safeChatHistory.map((chat) => (
                <div key={chat.id} className="space-y-4">
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm">
                      {chat.prompt}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="max-w-[80%]">
                      {chat.aiUnavailable && (
                        <Alert variant="destructive" className="mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>AI unavailable — check your provider configuration.</AlertDescription>
                        </Alert>
                      )}
                      <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none shadow-sm whitespace-pre-wrap">
                        {chat.response}
                      </div>
                      {chat.sources?.length ? <SourceCitation sources={chat.sources} /> : null}
                      {chat.studyPlan ? <StudyPlan studyPlan={chat.studyPlan} /> : null}
                      {chat.taskPriorities?.length ? (
                        <div className="mt-3 space-y-2">
                          {chat.taskPriorities.map((task) => (
                            <div key={task.taskId} className="rounded-md border bg-background px-3 py-2 text-sm">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-xs text-muted-foreground">{task.reason}</div>
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
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none w-32">
                    Thinking...
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
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="bg-background"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Configure AI_PROVIDER and AI_API_KEY in .env.local (see .env.example)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
