import type { Metadata } from "next";
import "./globals.css";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/components/cart-provider";

export const metadata: Metadata = {
  title: "TopDuka Storefront",
  description: "A fast, server-rendered storefront powered by the TopDuka public API.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-[#f4f0e8] text-[#171811] antialiased"><CartProvider>{children}<CartDrawer /></CartProvider></body>
    </html>
  );
}
