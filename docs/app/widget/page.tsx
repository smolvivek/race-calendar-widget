import type { Metadata } from "next";
import MiniWidget from "@/components/MiniWidget";

export const metadata: Metadata = { title: "Race Deck widget" };

export default function WidgetPage() {
  return <MiniWidget />;
}
