// Document Picture-in-Picture manager for Kiko Study Pet Companion
// Allows the mascot to float across all laptop windows/tabs with zero borders

type PipListener = (container: HTMLElement | null) => void;

let pipWindow: Window | null = null;
let pipContainer: HTMLElement | null = null;
const listeners = new Set<PipListener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(pipContainer);
    } catch (err) {
      console.warn("Error in PiP listener:", err);
    }
  });
}

/**
 * Check if the Picture-in-Picture window is currently open and valid
 */
export function isPetPipOpen(): boolean {
  return pipWindow !== null && !pipWindow.closed && pipContainer !== null;
}

/**
 * Get the current PiP root container element
 */
export function getPetPipContainer(): HTMLElement | null {
  if (pipWindow?.closed) {
    pipWindow = null;
    pipContainer = null;
  }
  return pipContainer;
}

/**
 * Subscribe to PiP container changes (e.g. for React portals)
 */
export function subscribeToPetPip(listener: PipListener): () => void {
  listeners.add(listener);
  // Immediately notify with current state
  listener(getPetPipContainer());
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Open the Document Picture-in-Picture window.
 * MUST be invoked in the synchronous call stack of a user gesture (e.g. onClick).
 */
export async function openPetPipWindow(): Promise<Window | null> {
  if (typeof window === "undefined" || !("documentPictureInPicture" in window)) {
    return null;
  }

  // If already open, bring to front
  if (pipWindow && !pipWindow.closed && pipContainer) {
    try {
      pipWindow.focus();
    } catch {}
    return pipWindow;
  }

  try {
    const pipWin = await (window as any).documentPictureInPicture.requestWindow({
      width: 220,
      height: 185,
    });
    pipWindow = pipWin;

    // Copy document stylesheets so Tailwind classes work if available
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

    // Inject self-contained styles: seamless dark background, zero border, animations
    const customStyle = document.createElement("style");
    customStyle.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html, body {
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #090d16 !important;
        color: #f8fafc !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        user-select: none !important;
        -webkit-user-select: none !important;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-6px) rotate(-3deg); }
        40%, 80% { transform: translateX(6px) rotate(3deg); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .animate-float { animation: float 3s ease-in-out infinite; }
      .animate-shake { animation: shake 0.4s ease-in-out; }
      .animate-bounce { animation: bounce 0.6s ease-in-out infinite; }
      .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    `;
    pipWin.document.head.appendChild(customStyle);
    pipWin.document.title = "Kiko Focus Companion";

    const container = pipWin.document.createElement("div");
    container.id = "pip-pet-root";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    pipWin.document.body.appendChild(container);

    pipContainer = container;
    notifyListeners();

    pipWin.addEventListener("pagehide", () => {
      pipWindow = null;
      pipContainer = null;
      notifyListeners();
    });

    return pipWin;
  } catch (err) {
    console.warn("Could not request Picture-in-Picture window:", err);
    return null;
  }
}

/**
 * Close the Picture-in-Picture window programmatically
 */
export function closePetPipWindow() {
  if (pipWindow && !pipWindow.closed) {
    try {
      pipWindow.close();
    } catch {}
  }
  pipWindow = null;
  pipContainer = null;
  notifyListeners();
}
