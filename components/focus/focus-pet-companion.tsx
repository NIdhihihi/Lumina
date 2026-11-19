"use client";

import { useState, useEffect, useRef } from "react";
import { useLuminaStore } from "@/hooks/use-lumina-store";
import { getPetReaction } from "@/lib/focus/pet-companion";
import { 
  X, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  Timer,
  Users
} from "lucide-react";

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
    setPetEnabled
  } = useLuminaStore();

  const [isSlapping, setIsSlapping] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // offset from bottom-right inside Lumina
  const [isDragging, setIsDragging] = useState(false);
  const [showSpeech, setShowSpeech] = useState(true);

  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 });
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isActive, timeLeft, totalDuration, petMood, petSpeech, isPetEnabled } = focusSession;

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
        }, 5000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, totalDuration, updateFocusTimeLeft, setPetMood, stopFocus, soundEnabled]);

  // 2. Global Tab/Window Unfocus Detection (Direct comic slap on the mascot)
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

  // 6. Speech Bubble Auto-Hide (keep speech visible for 5s after each update)
  useEffect(() => {
    if (petSpeech) {
      setShowSpeech(true);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = setTimeout(() => {
        setShowSpeech(false);
      }, 5000);
    }
    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, [petSpeech, petMood]);

  // Draggable logic for in-app floating companion
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

  // Turn off pet: hides pet companion
  const handleTurnOffPet = () => {
    setPetEnabled(false);
  };

  // Called strictly after all hooks
  if (!isPetEnabled || (!isActive && petMood !== "celebrating")) {
    return null;
  }

  // Mascot Visual Character & Capsule Pill (Clean floating figure with no window border)
  const mascotBody = (
    <div className={`relative flex flex-col items-center select-none ${isSlapping ? "animate-shake" : ""}`}>
      {/* Floating Speech Bubble */}
      {showSpeech && petSpeech && (
        <div className="relative mb-1.5 max-w-[200px] animate-in fade-in zoom-in-95 duration-200 z-30">
          <div
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium shadow-2xl border backdrop-blur-md transition-all ${
              petMood === "angry"
                ? "bg-red-950/95 border-red-500/70 text-red-200 font-semibold"
                : petMood === "jealous"
                ? "bg-purple-950/95 border-purple-500/70 text-purple-200"
                : petMood === "celebrating"
                ? "bg-emerald-950/95 border-emerald-500/70 text-emerald-200 font-bold"
                : "bg-slate-900/95 border-slate-700/80 text-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-1">
              <p className="leading-tight">{petSpeech}</p>
              <button
                onClick={() => setShowSpeech(false)}
                className="text-slate-400 hover:text-white shrink-0 p-0.5"
                title="Dismiss dialogue"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
          {/* Bubble pointer tail */}
          <div
            className={`w-2 h-2 rotate-45 mx-auto -mt-1 border-r border-b ${
              petMood === "angry"
                ? "bg-red-950/95 border-red-500/70"
                : petMood === "jealous"
                ? "bg-purple-950/95 border-purple-500/70"
                : petMood === "celebrating"
                ? "bg-emerald-950/95 border-emerald-500/70"
                : "bg-slate-900/95 border-slate-700/80"
            }`}
          />
        </div>
      )}

      {/* Comic Slap Burst Label on the character */}
      {isSlapping && (
        <div className="absolute -top-5 text-lg font-black italic text-red-500 drop-shadow-[0_4px_8px_rgba(239,68,68,0.8)] animate-bounce z-40">
          💥 SLAP!
        </div>
      )}

      {/* Circular Mascot Avatar Container (Clean floating figure matching reference image) */}
      <div 
        onClick={handlePoke}
        className={`relative w-20 h-20 rounded-full bg-[#0d1527] border border-white/5 flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
          petMood === "angry" ? "animate-bounce" : "animate-float"
        }`}
        title="Kiko Study Pet — Click to interact"
      >
        <svg
          width="70"
          height="70"
          viewBox="0 0 100 100"
          className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
        >
          {/* Ambient Aura */}
          <circle
            cx="50"
            cy="50"
            r="44"
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

          {/* Cloud Hair Puffs (Mascot silhouette) */}
          <circle cx="50" cy="24" r="14" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <circle cx="34" cy="30" r="13" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <circle cx="66" cy="30" r="13" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <circle cx="26" cy="42" r="12" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <circle cx="74" cy="42" r="12" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />

          {/* Rounded Head & Body */}
          <rect
            x="24"
            y="28"
            width="52"
            height="46"
            rx="20"
            fill={petMood === "angry" ? "#ef4444" : petMood === "jealous" ? "#8b5cf6" : "#4f8cf6"}
          />

          {/* Arms */}
          <ellipse cx="20" cy="54" rx="5" ry="9" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />
          <ellipse cx="80" cy="54" rx="5" ry="9" fill={petMood === "angry" ? "#dc2626" : petMood === "jealous" ? "#7c3aed" : "#3b82f6"} />

          {/* Feet */}
          <rect x="37" y="70" width="8" height="10" rx="4" fill={petMood === "angry" ? "#b91c1c" : petMood === "jealous" ? "#6d28d9" : "#2563eb"} />
          <rect x="55" y="70" width="8" height="10" rx="4" fill={petMood === "angry" ? "#b91c1c" : petMood === "jealous" ? "#6d28d9" : "#2563eb"} />

          {/* Terminal Screen Face Visor */}
          <rect
            x="31"
            y="36"
            width="38"
            height="26"
            rx="8"
            fill="#080d1a"
            stroke={petMood === "angry" ? "#f87171" : petMood === "jealous" ? "#c084fc" : "#38bdf8"}
            strokeWidth="1.5"
          />

          {/* Expressive Terminal Face Elements */}
          {petMood === "angry" ? (
            <g>
              <path d="M 37 46 L 43 49 L 37 52" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 63 46 L 57 49 L 63 52" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 46 55 Q 50 52 54 55" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </g>
          ) : petMood === "jealous" ? (
            <g>
              <path d="M 37 48 L 43 48 L 43 52" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M 63 48 L 57 48 L 57 52" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="47" y1="55" x2="53" y2="55" stroke="#c084fc" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          ) : petMood === "celebrating" ? (
            <g>
              <path d="M 37 50 Q 41 44 45 50" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 55 50 Q 59 44 63 50" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M 46 55 Q 50 59 54 55" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </g>
          ) : (
            <g>
              {/* Terminal prompt: > */}
              <path d="M 38 45 L 44 49 L 38 53" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              {/* Terminal cursor: - */}
              <line x1="53" y1="53" x2="60" y2="53" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" className="animate-pulse" />
            </g>
          )}

          {/* Chest Terminal Logo: > _ */}
          <path d="M 45 66 L 47 68 L 45 70" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.9" />
          <line x1="49" y1="70" x2="53" y2="70" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
        </svg>

        {/* Status Dot at 4 o'clock on the circle (Matching reference image) */}
        <div className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1">
          {petMood === "angry" ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] text-white shadow-md ring-2 ring-[#090d16]">
              💢
            </span>
          ) : petMood === "jealous" ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] text-white shadow-md ring-2 ring-[#090d16]">
              😤
            </span>
          ) : (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-amber-300 font-bold shadow-md ring-2 ring-[#090d16]">
              ⚡
            </span>
          )}
        </div>
      </div>

      {/* Floating Capsule Pill (⏱️ 24:50 | 👥 🔊 ⏸️ ❌) */}
      <div className="mt-2 flex items-center gap-2 bg-[#0d1527]/95 border border-white/10 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md">
        {/* Left: Stopwatch Timer & Countdown */}
        <div className="flex items-center gap-1.5 pr-1.5 border-r border-white/15">
          <Timer className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-xs font-bold text-white tracking-tight">{timeFormatted}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Squad Rivalry Prompt */}
          <button
            type="button"
            className="p-1 rounded-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
            onClick={triggerSquadJealousy}
            title="Squad Peer Check"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          {/* Sound toggle */}
          <button
            type="button"
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute Slap Sound" : "Enable Slap Sound"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Pause/Resume */}
          <button
            type="button"
            className="p-1 rounded-full text-white hover:text-emerald-400 hover:bg-white/10 transition-colors"
            onClick={isActive ? pauseFocus : resumeFocus}
            title={isActive ? "Pause Focus" : "Resume Focus"}
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Turn Off Pet */}
          <button
            type="button"
            className="p-1 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            onClick={handleTurnOffPet}
            title="Turn Off Study Pet"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Clean, borderless floating figure on screen (No OS window, no localhost:3000 frame)
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

      {/* Clean Floating Pet Figure */}
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
