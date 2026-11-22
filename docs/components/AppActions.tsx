"use client";
import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import MiniWidget from "./MiniWidget";

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
type PipApi = { requestWindow: (o: { width: number; height: number }) => Promise<Window> };

export default function AppActions() {
  const deferred = useRef<InstallEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
    const onPrompt = (e: Event) => { e.preventDefault(); deferred.current = e as InstallEvent; setCanInstall(true); };
    const onInstalled = () => { deferred.current = null; setCanInstall(false); setStandalone(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const install = async () => {
    const e = deferred.current;
    if (!e) { setTip((t) => !t); return; }
    await e.prompt();
    await e.userChoice;
    deferred.current = null;
    setCanInstall(false);
  };

  // Chrome and Edge can float a small window above every other app. Elsewhere, open a small popup.
  const popOut = async () => {
    const pip = (window as unknown as { documentPictureInPicture?: PipApi }).documentPictureInPicture;
    if (!pip) { window.open("/widget", "race-deck-widget", "popup=yes,width=360,height=420"); return; }
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
      const mount = w.document.createElement("div");
      w.document.body.appendChild(mount);
      const root: Root = createRoot(mount);
      root.render(<MiniWidget syncTitle={false} />);
      w.addEventListener("pagehide", () => root.unmount());
    } catch {
      window.open("/widget", "race-deck-widget", "popup=yes,width=360,height=420");
    }
  };

  return (
    <>
      <div className="acts">
        <button className="act" onClick={popOut}>Pop out widget</button>
        {!standalone && <button className="act" onClick={install} aria-expanded={tip}>Install app</button>}
      </div>
      {tip && !standalone && (
        <p className="tip" role="status">
          Chrome or Edge: click the install icon at the right end of the address bar, or open the browser menu and choose Install Race Deck.
          Safari on Mac: File, then Add to Dock. It then opens in its own window with no browser bar. For a small always-on-top window, use Pop out widget.
        </p>
      )}
    </>
  );
}
