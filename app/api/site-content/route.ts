import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CONTENT_FILE = path.join(process.cwd(), "lib", "site-content.json");

const DEFAULT_CONTENT = {
  deliveryBanner: {
    text: "Free delivery around Juja town",
    helpText: "Need help? Call +254 724 126 009",
    enabled: true,
  },
  heroSection: {
    badge: "The Alicia edit · 2026",
    title: "Technology that feels like yours.",
    subtitle: "Real products from the brands you know. Thoughtfully selected, clearly priced and ready to deliver.",
    ctaPrimary: "Shop featured",
    ctaSecondary: "Browse collection",
    enabled: true,
  },
  promoCards: [
    { id: "promo-1", title: "Gaming, upgraded", detail: "Headsets, controllers & more", tone: "from-[#22103c] to-[#833c9e]", category: "Gaming", enabled: true },
    { id: "promo-2", title: "Sound without limits", detail: "Wireless audio for every day", tone: "from-[#0c2a1c] to-[#147243]", category: "Audio", enabled: true },
  ],
  motionBanner: [
    { id: "mb-1", title: "COUNTRY WIDE DELIVERY", subtitle: "Fast Delivery", enabled: true },
    { id: "mb-2", title: "GREAT PRICES", subtitle: "Best Price Guarantee", enabled: true },
    { id: "mb-3", title: "SUPPORT 24/7", subtitle: "Get In Touch With Us", enabled: true },
    { id: "mb-4", title: "QUALITY GUARANTEE", subtitle: "Original Product", enabled: true },
  ],
  headerNav: [
    { id: "nav-home", label: "Home", href: "/", enabled: true },
    { id: "nav-blog", label: "Blog", href: "/blog", enabled: true },
  ],
  footer: {
    description: "Premium phones and practical technology for every day in Kenya.",
    shopWithConfidence: "Secure checkout · Verified products · Fast delivery",
    phone: "+254 724 126 009",
    email: "aliciaphoneplaceke@gmail.com",
  },
  sectionTags: [
    { id: "tag-featured", label: "Featured Products", heading: "Featured products", subheading: "Chosen for you", enabled: true },
    { id: "tag-brands", label: "Phone Brand Showcase", heading: "Your next phone, your way", subheading: "Shop by phone brand", enabled: true },
    { id: "tag-categories", label: "Category Grid", heading: "Start with a category", subheading: "Explore by need", enabled: true },
    { id: "tag-catalog", label: "Product Catalog", heading: "Trending now", subheading: "Curated collection", enabled: true },
  ],
};

async function readContent() {
  try {
    const raw = await fs.readFile(CONTENT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONTENT;
  }
}

async function writeContent(content: unknown) {
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf-8");
}

export async function GET() {
  const content = await readContent();
  return NextResponse.json(content);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await writeContent(body);
  return NextResponse.json({ success: true });
}
