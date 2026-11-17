"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Pin, 
  MessageSquare, 
  FileCode, 
  Cpu, 
  Users, 
  Sparkles, 
  ExternalLink 
} from "lucide-react";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  pinnedType?: "code" | "whiteboard" | null;
  pinnedTitle?: string;
}

interface GroupChatProps {
  messages: ChatMessage[];
  pinnedSnippet: any;
  onSendMessage: (content: string, senderName: string, avatar: string) => void;
  onSelectTab: (tab: "chat" | "whiteboard" | "pasteboard") => void;
  currentUser: string;
  onSwitchUser: (userName: string, avatar: string) => void;
}

export function GroupChat({
  messages,
  pinnedSnippet,
  onSendMessage,
  onSelectTab,
  currentUser,
  onSwitchUser,
}: GroupChatProps) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const avatar = currentUser === "Renee" ? "👩‍💻" : currentUser === "Vatsal" ? "👨‍💻" : "🐼";
    onSendMessage(inputText.trim(), currentUser, avatar);
    setInputText("");
  };

  return (
    <Card className="border flex flex-col h-full">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Study Squad Discussion
          </CardTitle>
          <CardDescription className="text-xs">
            Persistent group chat with live pinned Whiteboard & Pasteboard.
          </CardDescription>
        </div>

        {/* User Identity Switcher (Renee / Vatsal / Priya) */}
        <div className="flex items-center gap-1.5 bg-accent/40 p-1 rounded-lg text-xs">
          <span className="text-[10px] text-muted-foreground mr-1">Chatting as:</span>
          <button
            onClick={() => onSwitchUser("Renee", "👩‍💻")}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              currentUser === "Renee" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            👩‍💻 Renee
          </button>
          <button
            onClick={() => onSwitchUser("Vatsal", "👨‍💻")}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              currentUser === "Vatsal" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            👨‍💻 Vatsal
          </button>
          <button
            onClick={() => onSwitchUser("Priya", "🐼")}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              currentUser === "Priya" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🐼 Priya
          </button>
        </div>
      </CardHeader>

      {/* Pinned Utilities Notice Bar */}
      {pinnedSnippet && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Pin className="w-3.5 h-3.5 text-primary rotate-45" />
            <span>
              <strong>Pinned Pasteboard:</strong> {pinnedSnippet.title} ({pinnedSnippet.language})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-primary hover:underline"
            onClick={() => onSelectTab("pasteboard")}
          >
            Open Live Pasteboard <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}

      {/* Messages Feed */}
      <CardContent className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px]">
        {messages.map((msg) => {
          const isMe = msg.senderName === currentUser;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 items-start ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm shrink-0 border">
                {msg.senderAvatar || "👤"}
              </div>

              <div className={`space-y-1 max-w-[80%] ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
                  <span className="font-semibold text-foreground">{msg.senderName}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                      : "bg-muted rounded-tl-none border shadow-sm text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {/* Attached Pinned Item Card in Chat */}
                  {msg.pinnedType && (
                    <div
                      onClick={() => onSelectTab(msg.pinnedType as any)}
                      className={`mt-2 p-2 rounded-lg border cursor-pointer flex items-center justify-between gap-2 text-[11px] transition-colors ${
                        isMe ? "bg-black/20 border-white/20 hover:bg-black/30" : "bg-card border-border hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {msg.pinnedType === "whiteboard" ? (
                          <Cpu className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-green-400" />
                        )}
                        <span>{msg.pinnedTitle || "Pinned Item"}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Open Live
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </CardContent>

      {/* Message Input Footer */}
      <CardFooter className="p-3 border-t bg-card">
        <form onSubmit={handleSend} className="flex items-center gap-2 w-full">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message as ${currentUser}...`}
            className="text-xs h-9"
          />
          <Button type="submit" size="sm" className="h-9 px-4">
            <Send className="w-4 h-4 mr-1" /> Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
