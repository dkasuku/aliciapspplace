import { NextResponse } from "next/server";
import { api } from "@/lib/api";
import { fallbackProducts } from "@/lib/catalog";
import type { Product } from "@/lib/api/types";

const BASE_PROMPT = `You are the customer support assistant for Alicia Phone Place, a phone and tech store located in Juja, Kenya.

About Alicia Phone Place:
- Located in Juja town, Kenya
- Sells smartphones (Samsung Galaxy S/A/Z series, Apple iPhone, Tecno, Google Pixel), tablets (iPad, Samsung Galaxy Tab, Android tablets), mobile accessories (chargers, power banks, phone cases, cables, screen protectors), audio devices (wireless headphones, earbuds, Bluetooth speakers, wired headphones), gaming gear (headsets, controllers, mice, keyboards), and content creator equipment (microphones, ring lights, tripods, portable SSDs, webcams)
- Offers free delivery around Juja town
- Customer care phone/WhatsApp: +254 724 126 009
- Customer care email: aliciaphoneplaceke@gmail.com
- Secure checkout, genuine products, and fast delivery

Lipa Pole Pole (Pay Slowly / Rental Phones):
- Alicia Phone Place offers phones both for outright sale AND through "Lipa Pole Pole" (pay slowly) rental plans
- Lipa Pole Pole allows customers to pay for phones in DAILY installments — a small fixed amount every day until the phone is fully paid off
- Rental phones are marked with a "Lipa Pole Pole" badge on the website
- Each rental phone has specific rental terms (e.g. "KES 500/day for 365 days") shown on the product page
- Customers interested in Lipa Pole Pole need to provide: their ID number, contact details, and may need to be verified
- The store works with loan companies to facilitate these payment plans
- When a customer asks about paying in installments, flexible payments, paying slowly, or renting a phone, direct them to the Lipa Pole Pole option
- Explain that they can apply for Lipa Pole Pole directly on the product page by clicking "Apply for Lipa Pole Pole"
- For specific rental terms, down payment amounts, or loan company details, refer them to customer care at +254 724 126 009

Your role:
- Answer ANY questions customers ask about phones, tablets, accessories, audio devices, gaming gear, or content creator equipment — including comparisons, recommendations, specs, and buying advice
- When recommending products, ALWAYS use markdown links to the product page. Format: [Product Name](/products/PRODUCT_ID)
- Include the price when you know it from the product catalog below
- Clearly distinguish between phones available for sale vs phones available on Lipa Pole Pole (rental/installment plans)
- Be knowledgeable about phone brands: Samsung, Apple, Tecno, Google Pixel — help customers compare features, camera quality, battery life, performance, etc.
- Help customers choose the right accessories (cases, chargers, earbuds, etc.) for their devices
- Explain the Lipa Pole Pole program when customers ask about installment payments, flexible payment, or renting phones
- Be friendly, concise, and helpful — keep responses short but informative
- If you don't know exact current stock levels, tell the customer to browse the website catalog or contact the store
- When a customer asks to talk to a human, requests human support, or seems unsatisfied with AI help, refer them to customer care:
  * "I can connect you with our customer care team. You can call or WhatsApp us at +254 724 126 009."
  * Always provide both options: call AND WhatsApp
- You are a product expert for phones and tech — feel free to give detailed answers about phone features, comparisons, and recommendations
- When you recommend a product from the catalog, link to it so the customer can view it directly`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Attachment {
  id?: string;
  product_id?: string;
  name?: string;
  title?: string;
  price?: number | string;
  image?: string;
}

function buildProductCatalog(products: Product[]): string {
  if (!products.length) return "No products currently available in the catalog.";
  const lines = products.map((p) => {
    const price = p.sales_price ?? p.price;
    const img = p.images?.[0] || "";
    const rentalInfo = p.product_type === "rental" ? ` | TYPE: LIPA_POLE_POLE (rental) | Rental terms: ${p.rental_terms || "Contact store"}` : " | TYPE: SALE";
    return `- ID: ${p.id} | ${p.name} | Price: ${price} KES | Categories: ${p.categories?.join(", ") || "N/A"} | Stock: ${p.stock ?? 0}${rentalInfo} | Image: ${img} | Description: ${p.description || "N/A"}`;
  });
  return `Here are the current products in our catalog. Use these when making recommendations. Always link to /products/{ID} when recommending a product. Products marked as LIPA_POLE_POLE are available on installment/rental plans:\n\n${lines.join("\n")}`;
}

function extractAttachments(reply: string, products: Product[]): Attachment[] {
  const attachments: Attachment[] = [];
  const linkRegex = /\[([^\]]+)\]\(\/products\/([^)]+)\)/g;
  let match;
  const seen = new Set<string>();
  while ((match = linkRegex.exec(reply)) !== null) {
    const productId = match[2];
    if (seen.has(productId)) continue;
    seen.add(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      attachments.push({
        product_id: product.id,
        name: product.name,
        price: product.sales_price ?? product.price,
        image: product.images?.[0],
      });
    }
  }
  return attachments;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: unknown;
    session_id?: unknown;
    messages?: ChatMessage[];
  };

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    return NextResponse.json(
      { error: "Enter a message between 1 and 2,000 characters." },
      { status: 400 },
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI support is not configured. Please call +254 724 126 009 for help." },
      { status: 503 },
    );
  }

  let products: Product[] = fallbackProducts;
  try {
    products = await api.products.list({ status: "active" });
    if (!products.length) products = fallbackProducts;
  } catch {
    products = fallbackProducts;
  }

  const catalogContext = buildProductCatalog(products);
  const systemPrompt = `${BASE_PROMPT}\n\n${catalogContext}`;

  const priorMessages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages.filter((m) => m.role === "user" || m.role === "assistant").slice(-10)
    : [];

  const chatMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...priorMessages,
    { role: "user", content: message },
  ];

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: chatMessages,
        max_tokens: 800,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("DeepSeek API error:", res.status, errText);
      return NextResponse.json(
        { error: "I'm having trouble connecting right now. Please call +254 724 126 009." },
        { status: 502 },
      );
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response. Please call +254 724 126 009.";

    const attachments = extractAttachments(reply, products);

    return NextResponse.json({
      message: reply,
      attachments: attachments.length > 0 ? attachments : undefined,
      session_id: typeof body.session_id === "string" ? body.session_id : `ds_${Date.now()}`,
    });
  } catch (error) {
    console.error("DeepSeek request failed:", error);
    return NextResponse.json(
      { error: "I'm unavailable right now. Please call +254 724 126 009 for help." },
      { status: 502 },
    );
  }
}
