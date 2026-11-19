"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { getPetReaction, type PetMood } from "@/lib/focus/pet-companion";
import { 
  X, 
  Minimize2, 
  Maximize2, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  Timer,
  Users,
  AppWindow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Zero-asset Web Audio synthesizer for comical anime slap & praise chime
function playWebAudioSound(type: "slap" | "chime" | "cheer") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "slap") {
      // Noise burst + fast downward pitch drop for comic slap effect
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === "chime") {
      // Gentle dual chime for praise
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.45);
      });
    }
  } catch {
    // Ignore audio permission or disabled errors
  }
}

export function FocusPetCompanion() {
  const { 
    focusSession, 
    updateFocusTimeLeft, 
    recordDistraction, 
    setPetMood, 
    pauseFocus, 
    resumeFocus, 
    stopFocus,
    togglePetEnabled
  } = useLuminaStore();

  const [minimized, setMinimized] = useState(false);
  const [isSlapping, setIsSlapping] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // offset from bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 });
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pipWindowRef = useRef<any>(null);

  const { isActive, timeLeft, totalDuration, topic, distractionCount, petMood, petSpeech, isPetEnabled } = focusSession;

  // Formatting mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // 1. Live Countdown Timer Loop
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      if (timeLeft > 1) {
        updateFocusTimeLeft(timeLeft - 1);

        // Praise every 5 minutes (300 seconds)
        if ((totalDuration - timeLeft) > 0 && (totalDuration - timeLeft) % 300 === 0) {
          const praise = getPetReaction("long_focus");
          setPetMood(praise.mood, praise.speech);
          if (soundEnabled) playWebAudioSound("chime");
        }
      } else {
        // Session complete celebration
        updateFocusTimeLeft(0);
        const celeb = getPetReaction("session_complete");
        setPetMood(celeb.mood, celeb.speech);
        if (soundEnabled) playWebAudioSound("chime");
        setTimeout(() => {
          stopFocus();
        }, 5000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, totalDuration, updateFocusTimeLeft, setPetMood, stopFocus, soundEnabled]);

  // 2. Request Notification permission on active focus
  useEffect(() => {
    if (isActive && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [isActive]);

  // 3. Global Visibility / Tab-Switch Detection for Angry Slap Attack & OS Desktop Alerts
  useEffect(() => {
    if (!isActive) return;

    const handleVisibility = () => {
      if (document.hidden) {
        // User switched away to another tab or laptop application!
        const angry = getPetReaction("tab_switch");
        recordDistraction(angry.speech);
        setIsSlapping(true);
        setIsScreenShaking(true);
        if (soundEnabled) playWebAudioSound("slap");

        // Flash browser tab title
        document.title = `💥 😾 GET BACK TO WORK! (${timeFormatted})`;

        // System OS Notification on laptop screen
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("💥 Kiko: GET BACK TO WORK! 😾", {
              body: "Screen switch detected! Put the distractions away and lock in!",
              silent: false,
            });
          } catch {
            // ignore
          }
        }

        setTimeout(() => {
          setIsSlapping(false);
          setIsScreenShaking(false);
        }, 1200);
      } else {
        document.title = "Lumina - Student Intelligence";
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden) {
        const angry = getPetReaction("tab_switch");
        recordDistraction(angry.speech);
        setIsSlapping(true);
        if (soundEnabled) playWebAudioSound("slap");
        setTimeout(() => setIsSlapping(false), 1200);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
      document.title = "Lumina - Student Intelligence";
    };
  }, [isActive, recordDistraction, soundEnabled, timeFormatted]);

  // 4. Periodic Squad Rivalry Trigger
  useEffect(() => {
    if (!isActive) return;
    const squadInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const squadReaction = getPetReaction("squad_rivalry", { squadMember: "Priya" });
        setPetMood(squadReaction.mood, squadReaction.speech);
      }
    }, 180000);

    return () => clearInterval(squadInterval);
  }, [isActive, setPetMood]);

  // 5. Screen shake effect when angry slap occurs
  useEffect(() => {
    if (isScreenShaking) {
      document.body.classList.add("animate-shake");
      const t = setTimeout(() => {
        document.body.classList.remove("animate-shake");
      }, 500);
      return () => {
        clearTimeout(t);
        document.body.classList.remove("animate-shake");
      };
    }
  }, [isScreenShaking]);

  // 6. Draggable mouse event listener
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  // 7. Custom Document PiP Toggle Event Listener (can be triggered from Focus page or button)
  useEffect(() => {
    const handleCustomPip = () => {
      togglePipWindow();
    };
    window.addEventListener("lumina-toggle-pip", handleCustomPip);
    return () => window.removeEventListener("lumina-toggle-pip", handleCustomPip);
  }, [pipContainer]);

  // Draggable handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePoke = () => {
    const poke = getPetReaction("poke");
    setPetMood(poke.mood, poke.speech);
  };

  const triggerSquadJealousy = () => {
    const rival = getPetReaction("squad_rivalry", { squadMember: "Priya" });
    setPetMood(rival.mood, rival.speech);
    if (soundEnabled) playWebAudioSound("slap");
  };

  // Document Picture-in-Picture Handler (Allows the pet to float over other laptop apps & tabs)
  const togglePipWindow = async () => {
    if (pipContainer) {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
      }
      setPipContainer(null);
      pipWindowRef.current = null;
      return;
    }

    if (typeof window === "undefined" || !("documentPictureInPicture" in window)) {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
      alert("Floating over desktop apps utilizes the Document Picture-in-Picture API (available in Google Chrome and Microsoft Edge). Desktop notifications are enabled!");
      return;
    }

    try {
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({
        width: 270,
        height: 330,
      });
      pipWindowRef.current = pipWin;

      // Copy all active stylesheets to PiP window
      [...document.styleSheets].forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = sheet.href;
            pipWin.document.head.appendChild(link);
          } else if (sheet.cssRules) {
            const style = document.createElement("style");
            style.textContent = [...sheet.cssRules].map((r) => r.cssText).join("");
            pipWin.document.head.appendChild(style);
          }
        } catch {
          // ignore CORS errors
        }
      });

      // Apply theme and base styling
      pipWin.document.documentElement.className = document.documentElement.className;
      pipWin.document.title = "Kiko Focus Guardian";
      pipWin.document.body.className = "bg-background text-foreground flex items-center justify-center p-2 m-0 overflow-hidden";

      const container = pipWin.document.createElement("div");
      container.id = "pip-pet-root";
      container.className = "w-full flex justify-center";
      pipWin.document.body.appendChild(container);
      setPipContainer(container);

      pipWin.addEventListener("pagehide", () => {
        setPipContainer(null);
        pipWindowRef.current = null;
      });
    } catch (err) {
      console.warn("Could not open Document Picture-in-Picture:", err);
    }
  };

  // If focus session is not active (and not celebrating) or pet is disabled, hide the pet
  // (Called strictly AFTER all 18 hooks to preserve React Hook rules)
  if (!isPetEnabled || (!isActive && petMood !== "celebrating")) {
    return null;
  }

  // The Pet UI Body
  const petContent = (
    <div className="relative flex flex-col items-center max-w-[260px] select-none animate-in slide-in-from-bottom-5 duration-300">
      {/* Speech Bubble */}
      <div className="relative mb-2 w-full">
        <div
          className={`p-2.5 rounded-2xl text-xs font-medium shadow-xl border backdrop-blur-md transition-all duration-300 ${
            petMood === "angry"
              ? "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400 font-semibold"
              : petMood === "jealous"
              ? "bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400"
              : petMood === "celebrating"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
              : "bg-card/90 border-primary/20 text-foreground"
          }`}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="leading-snug">{petSpeech}</p>
            {!pipContainer && (
              <button
                onClick={() => setMinimized(true)}
                className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
                title="Minimize to pill"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        {/* Speech bubble tail pointer */}
        <div
          className={`w-3 h-3 rotate-45 mx-auto -mt-1.5 border-r border-b ${
            petMood === "angry"
              ? "bg-red-500/10 border-red-500/40"
              : petMood === "jealous"
              ? "bg-purple-500/10 border-purple-500/40"
              : petMood === "celebrating"
              ? "bg-emerald-500/10 border-emerald-500/40"
              : "bg-card border-primary/20"
          }`}
        />
      </div>

      {/* Character SVG Body */}
      <div 
        onClick={handlePoke}
        className={`relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${
          petMood === "angry" ? "animate-bounce" : "animate-float"
        }`}
        title="Click to interact with Kiko!"
      >
        <svg
          width="88"
          height="88"
          viewBox="0 0 100 100"
          className="drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]"
        >
          {/* Aura */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill={
              petMood === "angry"
                ? "rgba(239, 68, 68, 0.25)"
                : petMood === "jealous"
                ? "rgba(168, 85, 247, 0.25)"
                : petMood === "celebrating"
                ? "rgba(34, 197, 94, 0.25)"
                : "rgba(59, 130, 246, 0.2)"
            }
            className="animate-pulse"
          />

          {/* Ears */}
          <polygon
            points="22,35 15,12 38,24"
            fill={petMood === "angry" ? "#dc2626" : "#3b82f6"}
          />
          <polygon
            points="78,35 85,12 62,24"
            fill={petMood === "angry" ? "#dc2626" : "#3b82f6"}
          />
          {/* Inner Ears */}
          <polygon
            points="23,32 18,17 34,25"
            fill={petMood === "angry" ? "#fca5a5" : "#93c5fd"}
          />
          <polygon
            points="77,32 82,17 66,25"
            fill={petMood === "angry" ? "#fca5a5" : "#93c5fd"}
          />

          {/* Head / Body */}
          <circle
            cx="50"
            cy="54"
            r="34"
            fill={petMood === "angry" ? "#ef4444" : petMood === "jealous" ? "#8b5cf6" : "#2563eb"}
          />

          {/* Belly patch */}
          <ellipse cx="50" cy="62" rx="20" ry="16" fill="#ffffff" opacity="0.9" />

          {/* Face expressions based on PetMood */}
          {petMood === "angry" ? (
            <g>
              <line x1="32" y1="42" x2="45" y2="47" stroke="#1f2937" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="68" y1="42" x2="55" y2="47" stroke="#1f2937" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="38" cy="50" r="5" fill="#facc15" />
              <circle cx="62" cy="50" r="5" fill="#facc15" />
              <circle cx="39" cy="50" r="2" fill="#000000" />
              <circle cx="61" cy="50" r="2" fill="#000000" />
              <path d="M 42 66 Q 50 60 58 66" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>
          ) : petMood === "jealous" ? (
            <g>
              <path d="M 33 49 Q 39 44 45 49" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 55 49 Q 61 44 67 49" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 43 63 Q 47 66 50 63 Q 53 60 57 63" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <circle cx="38" cy="49" r="9" stroke="#1e293b" strokeWidth="2" fill="none" />
              <circle cx="62" cy="49" r="9" stroke="#1e293b" strokeWidth="2" fill="none" />
              <line x1="47" y1="49" x2="53" y2="49" stroke="#1e293b" strokeWidth="2" />
              <circle cx="38" cy="49" r="3.5" fill="#0f172a" />
              <circle cx="62" cy="49" r="3.5" fill="#0f172a" />
              <circle cx="37" cy="47" r="1.2" fill="#ffffff" />
              <circle cx="61" cy="47" r="1.2" fill="#ffffff" />
              <path d="M 44 62 Q 50 68 56 62" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="28" cy="56" r="3.5" fill="#f43f5e" opacity="0.5" />
              <circle cx="72" cy="56" r="3.5" fill="#f43f5e" opacity="0.5" />
            </g>
          )}

          {/* Graduation cap or Headband */}
          {petMood === "celebrating" ? (
            <polygon points="50,15 25,25 50,35 75,25" fill="#1e293b" />
          ) : (
            <path d="M 28 32 Q 50 24 72 32" stroke="#fbbf24" strokeWidth="4" fill="none" strokeLinecap="round" />
          )}
        </svg>

        {/* Status indicator badge */}
        <div className="absolute -bottom-1 -right-1">
          {petMood === "angry" ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white shadow">
              💢
            </span>
          ) : petMood === "jealous" ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white shadow">
              😤
            </span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white shadow">
              🔥
            </span>
          )}
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="mt-2 flex items-center justify-between gap-1.5 w-full bg-card/95 border border-border/80 px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono text-xs font-bold">{timeFormatted}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Float over other apps (Document PiP) */}
          <Button
            size="icon"
            variant="ghost"
            className={`h-6 w-6 ${pipContainer ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
            onClick={togglePipWindow}
            title={pipContainer ? "Return pet to webpage" : "Float pet on top of laptop screen (across all tabs & apps)"}
          >
            <AppWindow className="h-3 w-3" />
          </Button>

          {/* Squad Rivalry Prompt */}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
            onClick={triggerSquadJealousy}
            title="Squad Peer Check"
          >
            <Users className="h-3 w-3" />
          </Button>

          {/* Sound toggle */}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Slap Sound" : "Enable Slap Sound"}
          >
            {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3 text-muted-foreground" />}
          </Button>

          {/* Pause/Resume Focus */}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={isActive ? pauseFocus : resumeFocus}
            title={isActive ? "Pause Focus" : "Resume Focus"}
          >
            {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 text-emerald-500" />}
          </Button>

          {/* Exit Focus */}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive hover:bg-destructive/10"
            onClick={stopFocus}
            title="Finish Focus Mode"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {distractionCount > 0 && (
        <span className="mt-1 text-[10px] text-muted-foreground font-mono">
          {distractionCount} tab switch slap{distractionCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );

  // If active in native Document Picture-in-Picture window (floats on top of all laptop apps)
  if (pipContainer) {
    return createPortal(
      <div className="w-full flex items-center justify-center p-2">
        {petContent}
      </div>,
      pipContainer
    );
  }

  // Normal in-page floating widget
  return (
    <>
      {/* Full-Screen Comic Slap Overlay on Distraction */}
      {isSlapping && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-red-500/10 backdrop-blur-[1px] animate-in fade-in zoom-in-95 duration-150">
          <div className="relative flex flex-col items-center">
            <div className="text-6xl sm:text-8xl font-black italic tracking-tighter text-red-600 drop-shadow-[0_10px_20px_rgba(239,68,68,0.5)] transform -rotate-12 animate-bounce">
              💥 SLAP!
            </div>
            <div className="mt-2 bg-red-600 text-white font-bold px-4 py-1.5 rounded-full text-sm sm:text-base shadow-xl">
              SCREEN SWITCH DETECTED! GET BACK TO WORK!
            </div>
          </div>
        </div>
      )}

      {/* Floating Study Pet Container */}
      <aside
        aria-label="Study Pet Guardian"
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        className={`fixed bottom-6 right-6 z-50 transition-transform duration-75 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {minimized ? (
          <div className="flex items-center gap-2 bg-card/90 backdrop-blur-md border border-primary/30 p-2 rounded-full shadow-2xl hover:scale-105 transition-all">
            <span className="text-xl animate-pulse">
              {petMood === "angry" ? "😾" : petMood === "happy" ? "😻" : "😼"}
            </span>
            <span className="font-mono text-xs font-bold text-primary">{timeFormatted}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full"
              onClick={() => setMinimized(false)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          petContent
        )}
      </aside>
    </>
  );
}
