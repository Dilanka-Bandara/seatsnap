import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
export const metadata: Metadata = { title: "SeatSnap — Be there for the moment", description: "Discover events and find your seat in Sri Lanka. Foundation preview." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
