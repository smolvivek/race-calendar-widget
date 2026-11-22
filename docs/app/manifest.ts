import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Race Deck",
    short_name: "Race Deck",
    description: "F1 and MotoGP calendar, countdowns, results and standings.",
    id: "/",
    start_url: "/",
    shortcuts: [{ name: "Mini widget", short_name: "Widget", url: "/widget" }],
    display: "standalone",
    background_color: "#0e1318",
    theme_color: "#0e1318",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
