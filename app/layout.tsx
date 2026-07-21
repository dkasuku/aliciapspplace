import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({ subsets: ["latin"], variable: "--font-comfortaa" });

export const metadata: Metadata = {
  title: "Alicia Phone Store — Phones & Electronics",
  description: "Premium phones, gadgets, and electronics. Fast delivery, secure checkout, and expert support.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${comfortaa.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#f8faf5] text-[#0f172a] antialiased">
        {children}
      </body>
    </html>
  );
}
