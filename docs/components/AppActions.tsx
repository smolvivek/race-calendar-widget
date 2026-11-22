"use client";
import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import MiniWidget from "./MiniWidget";

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
type PipApi = { window: Window | null; requestWindow: (o: { width: number; height: number }) => Promise<Window> };

const POPUP = "popup=yes,width=360,height=420";

export default function AppActions() {
  const deferred = useRef<InstallEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
    setEmbedded(window.self !== window.top);
    const onPrompt = (e: Event) => { e.preventDefault(); deferred.current = e as InstallEvent; setCanInstall(true); };
    const onInstalled = () => { deferred.current = null; setCanInstall(false); setStandalone(true); setTip(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // The worker is what lets every Chromium browser offer installation, and keeps the last page available offline.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* private mode or blocked: install still works via the browser menu */ });
    }
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const install = async () => {
    if (embedded) { window.open(window.location.origin + "/", "_blank", "noopener"); return; }
    const e = deferred.current;
    if (!e) {
      setTip((t) => (t ? null : "install"));
      return;
    }
    setTip(null);
    await e.prompt();
    const choice = await e.userChoice;
    if (choice.outcome === "accepted") return;
    deferred.current = null;
    setCanInstall(false);
  };

  // Chrome and Edge float a small window above every other app. Elsewhere, open a small popup.
  const popOut = async () => {
    if (embedded) { window.open(window.location.origin + "/widget", "race-deck-widget", POPUP); return; }
    const pip = (window as unknown as { documentPictureInPicture?: PipApi }).documentPictureInPicture;
    if (!pip) {
      const w = window.open("/widget", "race-deck-widget", POPUP);
      if (!w) setTip("popup");
      return;
    }
    if (pip.window) { pip.window.close(); return; } // second click closes it
    try {
      const w = await pip.requestWindow({ width: 340, height: 400 });
      for (const sheet of Array.from(document.styleSheets)) {
        if (sheet.href) {
          const l = w.document.createElement("link"); l.rel = "stylesheet"; l.href = sheet.href; w.document.head.appendChild(l);
        } else {
          try {
            const s = w.document.createElement("style");
            s.textContent = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
            w.document.head.appendChild(s);
          } catch { /* cross-origin sheet */ }
        }
      }
      w.document.body.className = "pip";
      w.document.title = "Race Deck";
      const mount = w.document.createElement("div");
      w.document.body.appendChild(mount);
      const root: Root = createRoot(mount);
      root.render(<MiniWidget syncTitle={false} />);
      w.addEventListener("pagehide", () => root.unmount());
    } catch {
      const w = window.open("/widget", "race-deck-widget", POPUP);
      if (!w) setTip("popup");
    }
  };

  return (
    <>
      <div className="acts">
        <button className="act" onClick={popOut}>Pop out widget</button>
        {!standalone && (
          <button className="act" onClick={install} aria-expanded={tip === "install"} data-native={canInstall ? "true" : "false"}>
            Install app
          </button>
        )}
      </div>
      {tip === "install" && !standalone && (
        <p className="tip" role="status">
          Your browser has not offered to install this yet. In Chrome or Edge, use the install icon at the right end of the address bar, or the browser menu, then Install Race Deck.
          In Safari on a Mac, choose File, then Add to Dock. Firefox cannot install web apps; use Pop out widget instead.
        </p>
      )}
      {tip === "popup" && (
        <p className="tip" role="status">Your browser blocked the popup window. Allow popups for this site, then try again.</p>
      )}
    </>
  );
}
