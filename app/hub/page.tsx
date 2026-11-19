"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Cpu, Code2, Users, Pin, Sparkles, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GroupChat, type ChatMessage } from "@/components/collaboration/group-chat";
import { Whiteboard, type GateNode } from "@/components/collaboration/whiteboard";
import { Pasteboard, type PasteboardSnippet } from "@/components/collaboration/pasteboard";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { toast } from "sonner";

export default function DiscussionHubPage() {
  const { profile } = useLuminaStore();
  const primaryName = profile.name || "You";
  const [activeTab, setActiveTab] = useState<"chat" | "whiteboard" | "pasteboard">("chat");
  const [currentUser, setCurrentUser] = useState(primaryName);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [whiteboardGates, setWhiteboardGates] = useState<GateNode[]>([]);
  const [pinnedSnippet, setPinnedSnippet] = useState<PasteboardSnippet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial collaboration state from server
  const loadCollaborationState = async () => {
    try {
      const res = await fetch("/api/collaboration");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setWhiteboardGates(data.whiteboardElements || []);
        setPinnedSnippet(data.pinnedSnippet || null);
      }
    } catch {
      toast.error("Failed to load collaboration data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborationState();
  }, []);

  const handleSendMessage = async (content: string, senderName: string, avatar: string) => {
    const payload = {
      senderId: senderName.toLowerCase(),
      senderName,
      senderAvatar: avatar,
      content,
    };

    try {
      const res = await fetch("/api/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_message", payload }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {
      toast.error("Failed to post message");
    }
  };

  const handlePinCircuit = async (circuitData: any) => {
    const chatAnnouncement = {
      senderId: currentUser.toLowerCase(),
      senderName: currentUser,
      senderAvatar: currentUser === "Renee" ? "👩‍💻" : "👨‍💻",
      content: `${currentUser} updated and pinned the logic circuit diagram on the Whiteboard!`,
      pinnedType: "whiteboard",
      pinnedTitle: circuitData.title || "Logic Gate Circuit",
    };

    try {
      // 1. Update whiteboard state
      await fetch("/api/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_whiteboard", payload: { elements: circuitData.gates } }),
      });

      // 2. Post announcement to chat
      await fetch("/api/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_message", payload: chatAnnouncement }),
      });

      setWhiteboardGates(circuitData.gates);
      loadCollaborationState();
      setActiveTab("chat");
    } catch {
      toast.error("Failed to pin whiteboard circuit");
    }
  };

  const handlePinSnippet = async (snippet: PasteboardSnippet) => {
    const chatAnnouncement = {
      senderId: currentUser.toLowerCase(),
      senderName: currentUser,
      senderAvatar: currentUser === "Renee" ? "👩‍💻" : "👨‍💻",
      content: `${currentUser} dropped a live code snippet into the Pasteboard: ${snippet.title}`,
      pinnedType: "code",
      pinnedTitle: snippet.title,
    };

    try {
      // 1. Update pasteboard state
      await fetch("/api/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_pasteboard", payload: snippet }),
      });

      // 2. Post announcement to chat
      await fetch("/api/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_message", payload: chatAnnouncement }),
      });

      setPinnedSnippet(snippet);
      loadCollaborationState();
      setActiveTab("chat");
    } catch {
      toast.error("Failed to pin code snippet");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Group Discussion Hub</h2>
            <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
              ● Socket.io Live
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Persistent real-time suite featuring collaborative Whiteboard & code Pasteboard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCollaborationState} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-xs">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold">3 Active Members</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Discussion Chat
          </TabsTrigger>
          <TabsTrigger value="whiteboard" className="flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Logic Whiteboard
          </TabsTrigger>
          <TabsTrigger value="pasteboard" className="flex items-center gap-2">
            <Code2 className="w-4 h-4" /> Code Pasteboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="min-h-[550px]">
          <GroupChat
            messages={messages}
            pinnedSnippet={pinnedSnippet}
            onSendMessage={handleSendMessage}
            onSelectTab={setActiveTab}
            currentUser={currentUser}
            primaryUserName={primaryName}
            onSwitchUser={(user) => setCurrentUser(user)}
          />
        </TabsContent>

        <TabsContent value="whiteboard" className="min-h-[550px]">
          <Whiteboard
            initialGates={whiteboardGates}
            onPinToChat={handlePinCircuit}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="pasteboard" className="min-h-[550px]">
          <Pasteboard
            initialSnippet={pinnedSnippet}
            onPinSnippet={handlePinSnippet}
            currentUser={currentUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
