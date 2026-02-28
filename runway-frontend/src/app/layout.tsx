import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RUNWAY",
  description: "AI-Curated Editorial System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen flex selection:bg-white selection:text-black overflow-x-hidden`}>
        {/* Left Sidebar Navigation */}
        <aside className="w-64 border-r border-white/20 bg-black flex flex-col p-10 z-50 sticky top-0 h-screen shrink-0">
          <Link href="/" className="text-xl tracking-[0.4em] font-light uppercase text-white mb-20 hover:text-gray-400 transition-colors">
            RUNWAY
          </Link>
          <nav className="flex flex-col gap-10 flex-1">
            <Link href="/" className="text-[10px] tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
              The Casting Call
            </Link>
            <Link href="/dashboard" className="text-[10px] tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
              Season Dashboard
            </Link>
            <Link href="/archive" className="text-[10px] tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
              Past Seasons
            </Link>
          </nav>
          <div className="text-[9px] uppercase tracking-[0.2em] text-gray-600">
            System Beta v1.2
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
