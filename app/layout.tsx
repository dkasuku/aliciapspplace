import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopDuka Storefront",
  description: "A fast, server-rendered storefront powered by the TopDuka public API.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#f4f0e8] text-[#171811] antialiased">{children}</body>
    </html>
  );
}
