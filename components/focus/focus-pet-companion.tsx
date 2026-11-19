"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { getPetReaction, type PetMood } from "@/lib/focus/pet-companion";
import { 
  X, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  Timer,
  Users,
  AppWindow
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Zero-asset Web Audio synthesizer for comic anime slap & praise chime
function playWebAudioSound(type: "slap" | "chime") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "slap") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(380, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "chime") {
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.4);
      });
    }
  } catch {
    // Ignore audio permission/disabled issues
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

  const [isSlapping, setIsSlapping] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // offset from bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const [showSpeech, setShowSpeech] = useState(true);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 });
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pipWindowRef = useRef<any>(null);

  const { isActive, timeLeft, totalDuration, distractionCount, petMood, petSpeech, isPetEnabled } = focusSession;

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
          setShowSpeech(true);
          if (soundEnabled) playWebAudioSound("chime");
        }
      } else {
        // Session complete celebration
        updateFocusTimeLeft(0);
        const celeb = getPetReaction("session_complete");
        setPetMood(celeb.mood, celeb.speech);
        setShowSpeech(true);
        if (soundEnabled) playWebAudioSound("chime");
        setTimeout(() => {
          stopFocus();
          if (pipWindowRef.current) {
            try {
              pipWindowRef.current.close();
            } catch {}
          }
        }, 5000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, totalDuration, updateFocusTimeLeft, setPetMood, stopFocus, soundEnabled]);

  // 2. Global Tab/Window Unfocus Detection (Direct comic slap on the pet character)
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityOrBlur = () => {
      if (document.hidden) {
        const angry = getPetReaction("tab_switch");
        recordDistraction(angry.speech);
        setIsSlapping(true);
        setIsScreenShaking(true);
        setShowSpeech(true);
        if (soundEnabled) playWebAudioSound("slap");

        setTimeout(() => {
          setIsSlapping(false);
          setIsScreenShaking(false);
        }, 1200);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrBlur);
    window.addEventListener("blur", handleVisibilityOrBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrBlur);
      window.removeEventListener("blur", handleVisibilityOrBlur);
    };
  }, [isActive, recordDistraction, soundEnabled]);

  // 3. Periodic Squad Rivalry Banter
  useEffect(() => {
    if (!isActive) return;
    const squadInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const squadReaction = getPetReaction("squad_rivalry", { squadMember: "Priya" });
        setPetMood(squadReaction.mood, squadReaction.speech);
        setShowSpeech(true);
      }
    }, 180000);

    return () => clearInterval(squadInterval);
  }, [isActive, setPetMood]);

  // 4. Screen Shake on Angry Slap
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

  // 5. Draggable Mouse Listeners
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

  // 6. Speech Bubble Auto-Hide (keep speech visible for 7s after each update)
  useEffect(() => {
    if (petSpeech) {
      setShowSpeech(true);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = setTimeout(() => {
        setShowSpeech(false);
      }, 7000);
    }
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, [petSpeech, petMood]);

  // 7. Custom Document PiP Toggle & Open Event Listeners
  useEffect(() => {
    const handleCustomPip = () => {
      togglePipWindow();
    };
    const handleOpenPip = () => {
      if (!pipContainer) {
        togglePipWindow();
      }
    };
    window.addEventListener("lumina-toggle-pip", handleCustomPip);
    window.addEventListener("lumina-open-pip", handleOpenPip);
    return () => {
      window.removeEventListener("lumina-toggle-pip", handleCustomPip);
      window.removeEventListener("lumina-open-pip", handleOpenPip);
    };
  }, [pipContainer]);

  // Draggable logic
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
    setShowSpeech(true);
  };

  const triggerSquadJealousy = () => {
    const rival = getPetReaction("squad_rivalry", { squadMember: "Priya" });
    setPetMood(rival.mood, rival.speech);
    setShowSpeech(true);
    if (soundEnabled) playWebAudioSound("slap");
  };

  // Toggle PiP floating window across laptop screen
  const togglePipWindow = async () => {
    if (pipContainer) {
      if (pipWindowRef.current) {
        try {
          pipWindowRef.current.close();
        } catch {}
      }
      setPipContainer(null);
      pipWindowRef.current = null;
      return;
    }

    if (typeof window === "undefined" || !("documentPictureInPicture" in window)) {
      return;
    }

    try {
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({
        width: 220,
        height: 250,
      });
      pipWindowRef.current = pipWin;

      // Copy stylesheet rules to PiP window
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
        } catch {}
      });

      // Inject clean borderless dark styles
      const customStyle = document.createElement("style");
      customStyle.textContent = `
        * { box-sizing: border-box; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #090d16 !important;
          color: #f8fafc !important;
          overflow: hidden !important;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          user-select: none !important;
          font-family: system-ui, -apple-system, sans-serif !important;
        }
      `;
      pipWin.document.head.appendChild(customStyle);
      pipWin.document.title = "Kiko Focus Mascot";

      const container = pipWin.document.createElement("div");
      container.id = "pip-pet-root";
      container.style.width = "100%";
      container.style.display = "flex";
      container.style.justifyContent = "center";
      pipWin.document.body.appendChild(container);
      setPipContainer(container);

      pipWin.addEventListener("pagehide", () => {
        setPipContainer(null);
        pipWindowRef.current = null;
      });
    } catch (err) {
      console.warn("PiP Error:", err);
    }
  };

  // Called strictly after all 18 hooks
  if (!isPetEnabled || (!isActive && petMood !== "celebrating")) {
    return null;
  }

  // The Mascot Character & Pill Component
  const mascotBody = (
    <div className={`relative flex flex-col items-center select-none ${isSlapping ? "animate-shake" : ""}`}>
      {/* Floating Speech Bubble */}
      {showSpeech && (
        <div className="relative mb-2 max-w-[210px] animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`p-2.5 rounded-2xl text-[11px] font-medium shadow-2xl border backdrop-blur-md transition-all ${
              petMood === "angry"
                ? "bg-red-950/90 border-red-500/60 text-red-200 font-semibold"
                : petMood === "jealous"
                ? "bg-purple-950/90 border-purple-500/60 text-purple-200"
                : petMood === "celebrating"
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200 font-bold"
                : "bg-card/95 border-border/80 text-foreground"
            }`}
          >
            <div className="flex items-start justify-between gap-1">
              <p className="leading-snug">{petSpeech}</p>
              <button
                onClick={() => setShowSpeech(false)}
                className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
                title="Dismiss dialogue"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
          {/* Bubble pointer tail */}
          <div
            className={`w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5 border-r border-b ${
              petMood === "angry"
                ? "bg-red-950/90 border-red-500/60"
                : petMood === "jealous"
                ? "bg-purple-950/90 border-purple-500/60"
                : petMood === "celebrating"
                ? "bg-emerald-950/90 border-emerald-500/60"
                : "bg-card/95 border-border/80"
            }`}
          />
        </div>
      )}

      {/* Comic Slap Burst Label on the character */}
      {isSlapping && (
        <div className="absolute -top-6 text-xl font-black italic text-red-500 drop-shadow-[0_4px_8px_rgba(239,68,68,0.7)] animate-bounce z-20">
          💥 SLAP!
        </div>
      )}

      {/* Character Visual Mascot */}
      <div 
        onClick={handlePoke}
        className={`relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${
          petMood === "angry" ? "animate-bounce" : "animate-float"
        }`}
        title="Click to interact with your Study Pet!"
      >
        <svg
          width="76"
          height="82"
          viewBox="0 0 100 108"
          className="drop-shadow-[0_12px_22px_rgba(0,0,0,0.4)]"
        >
          {/* Ambient Aura */}
          <circle
            cx="50"
            cy="52"
            r="44"
            fill={
              petMood === "angry"
                ? "rgba(239, 68, 68, 0.28)"
                : petMood === "jealous"
                ? "rgba(168, 85, 247, 0.28)"
                : petMood === "celebrating"
                ? "rgba(34, 197, 94, 0.28)"
                : "rgba(59, 130, 246, 0.24)"
            }
            className="animate-pulse"
          />

          {/* Cloud/Puff Hair Bumps (Mascot silhouette) */}
          <circle cx="50" cy="22" r="14" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <circle cx="33" cy="28" r="13" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <circle cx="67" cy="28" r="13" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <circle cx="24" cy="40" r="12" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <circle cx="76" cy="40" r="12" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />

          {/* Main Rounded Head & Body */}
          <rect
            x="22"
            y="28"
            width="56"
            height="50"
            rx="22"
            fill={petMood === "angry" ? "#ef4444" : petMood === "jealous" ? "#8b5cf6" : "#4f8cf6"}
          />

          {/* Arms */}
          <ellipse cx="18" cy="56" rx="6" ry="11" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <ellipse cx="82" cy="56" rx="6" ry="11" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />

          {/* Legs */}
          <rect x="36" y="74" width="8" height="12" rx="4" fill={petMood === "angry" ? "#b91c1c" : petMood === "jealous" ? "#6d28d9" : "#2563eb"} />
          <rect x="56" y="74" width="8" height="12" rx="4" fill={petMood === "angry" ? "#b91c1c" : petMood === "jealous" ? "#6d28d9" : "#2563eb"} />

          {/* Terminal Screen Face Visor */}
          <rect
            x="30"
            y="38"
            width="40"
            height="28"
            rx="9"
            fill="#090d16"
            stroke={petMood === "angry" ? "#f87171" : petMood === "jealous" ? "#c084fc" : "#38bdf8"}
            strokeWidth="1.8"
          />

          {/* Expressive Terminal Face Elements */}
          {petMood === "angry" ? (
            <g>
              <path d="M 37 49 L 43 52 L 37 55" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 63 49 L 57 52 L 63 55" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 46 59 Q 50 56 54 59" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>
          ) : petMood === "jealous" ? (
            <g>
              <path d="M 37 51 L 43 51 L 43 55" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 63 51 L 57 51 L 57 55" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="47" y1="58" x2="53" y2="58" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ) : petMood === "celebrating" ? (
            <g>
              <path d="M 37 53 Q 41 47 45 53" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M 55 53 Q 59 47 63 53" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M 46 58 Q 50 62 54 58" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>
          ) : (
            <g>
              <path d="M 38 48 L 44 52 L 38 56" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="56" y1="56" x2="63" y2="56" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" className="animate-pulse" />
            </g>
          )}

          {/* Chest Terminal Logo: > _ */}
          <path d="M 45 70 L 48 72 L 45 74" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />
          <line x1="51" y1="74" x2="55" y2="74" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
        </svg>

        {/* Status indicator dot */}
        <div className="absolute -bottom-0.5 right-1">
          {petMood === "angry" ? (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[8px] text-white shadow ring-2 ring-background">
              💢
            </span>
          ) : petMood === "jealous" ? (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-600 text-[8px] text-white shadow ring-2 ring-background">
              😤
            </span>
          ) : (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white shadow ring-2 ring-background">
              ⚡
            </span>
          )}
        </div>
      </div>

      {/* Floating Mini Controls Pill (Image 2 style) */}
      <div className="mt-1.5 flex items-center gap-1.5 bg-card/90 border border-border/80 px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-1 pr-1 border-r border-border/60">
          <Timer className="w-3 h-3 text-primary" />
          <span className="font-mono text-[11px] font-bold tracking-tight">{timeFormatted}</span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Float across laptop screen button */}
          <Button
            size="icon"
            variant="ghost"
            className={`h-5 w-5 rounded-full ${pipContainer ? "text-primary bg-primary/15" : "text-muted-foreground hover:text-foreground"}`}
            onClick={togglePipWindow}
            title={pipContainer ? "Dock pet back to Lumina tab" : "Float pet on top of all laptop apps & windows"}
          >
            <AppWindow className="h-2.5 w-2.5" />
          </Button>

          {/* Squad Rivalry Prompt */}
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 rounded-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            onClick={triggerSquadJealousy}
            title="Squad Peer Check"
          >
            <Users className="h-2.5 w-2.5" />
          </Button>

          {/* Sound toggle */}
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Slap Sound" : "Enable Slap Sound"}
          >
            {soundEnabled ? <Volume2 className="h-2.5 w-2.5" /> : <VolumeX className="h-2.5 w-2.5" />}
          </Button>

          {/* Pause/Resume */}
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 rounded-full"
            onClick={isActive ? pauseFocus : resumeFocus}
            title={isActive ? "Pause Focus" : "Resume Focus"}
          >
            {isActive ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5 text-emerald-400" />}
          </Button>

          {/* Hide / Dismiss */}
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 rounded-full text-destructive hover:bg-destructive/10"
            onClick={togglePetEnabled}
            title="Hide Pet"
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {distractionCount > 0 && (
        <span className="mt-1 text-[9px] text-muted-foreground/80 font-mono">
          {distractionCount} slap{distractionCount > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );

  // If floating on top of laptop screen via Document PiP:
  if (pipContainer) {
    return createPortal(
      <div className="w-full flex items-center justify-center p-1">
        {mascotBody}
      </div>,
      pipContainer
    );
  }

  // Inside Lumina: Floating in the corner across all Lumina tabs
  return (
    <>
      {/* Full-Screen Comic Slap Overlay inside Lumina when distracted */}
      {isSlapping && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-red-500/10 backdrop-blur-[1px] animate-in fade-in zoom-in-95 duration-150">
          <div className="relative flex flex-col items-center">
            <div className="text-6xl sm:text-8xl font-black italic tracking-tighter text-red-600 drop-shadow-[0_10px_25px_rgba(239,68,68,0.6)] transform -rotate-12 animate-bounce">
              💥 SLAP!
            </div>
            <div className="mt-2 bg-red-600 text-white font-bold px-4 py-1.5 rounded-full text-xs sm:text-sm shadow-xl tracking-wide uppercase">
              Screen Switch Detected! Get Back To Work!
            </div>
          </div>
        </div>
      )}

      {/* Floating Pet Companion */}
      <aside
        aria-label="Lumina Focus Pet Companion"
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
        className={`fixed bottom-6 right-8 z-50 transition-transform duration-75 select-none flex flex-col items-center group ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {mascotBody}
      </aside>
    </>
  );
}
