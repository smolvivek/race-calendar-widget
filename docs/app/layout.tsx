import type { Metadata, Viewport } from "next";
import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/schibsted-grotesk";
import "./globals.css";

export const metadata: Metadata = {
  title: "Race Deck",
  description: "One calendar for Formula 1 and MotoGP: live countdowns, session times in your time zone, results and standings.",
  applicationName: "Race Deck",
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Race Deck", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8ebee" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1318" },
  ],
};

// Chrome can fire beforeinstallprompt before React has hydrated, so the event is captured here, early,
// and handed to the install button once it mounts. The worker is registered here for the same reason.
const EARLY = `
window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); window.__bip = e; window.dispatchEvent(new Event("bip-captured")); });
window.addEventListener("appinstalled", function () { window.__bip = null; });
${process.env.NODE_ENV === "production" ? `if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); }); }` : ""}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
