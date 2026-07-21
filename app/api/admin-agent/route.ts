import { NextResponse } from "next/server";
import { api } from "@/lib/api";
import type { Product, Category, InventoryItem, Sale, Stats } from "@/lib/api/types";

const BASE_PROMPT = `You are the AI admin assistant for Alicia Phone Place, a phone and tech store in Juja, Kenya.
You help the store admin manage their shop through the admin panel.

You can help with:
1. **Products**: Add products, list products, describe products, update product info
2. **Categories**: Add categories, list categories
3. **Inventory**: Check stock levels, identify low stock, restock products, understand stock flow
4. **Sales & Revenue**: Report revenue, total sales, today's performance
5. **Software guidance**: Explain how to use the admin panel and its features

Admin Panel Features:
- Home (/admin): Dashboard with stats overview
- Orders (/admin/orders): View and manage customer orders
- Bookings (/admin/bookings): Manage bookings
- Catalog (/admin/products): Add, edit, delete products
- Agents (/admin/agents): Manage AI agents
- Discounts (/admin/discounts): Create and manage discount codes
- Shipping (/admin/shipping): Configure shipping zones and methods
- Inventory (/admin/inventory): View stock levels, restock, adjust stock, view stock movements
- Users (/admin/users): Manage team members and roles
- POS / Sell (/admin/pos): Point of sale for in-store transactions
- Categories (/admin/categories): Manage product categories
- Sales (/admin/sales): View sales history and receipts

When the admin asks you to perform an action (add product, add category, restock), use the provided tool functions.
Always confirm the action with the admin before executing it.
Be concise but thorough. Use bullet points and clear formatting.
When reporting stats or stock, use tables or clear lists.
Currency is KES (Kenyan Shillings).

IMPORTANT - Action Instructions:
- To add a product, respond with a JSON block in this format:
  [ACTION:add_product]{"name":"Product Name","price":9999,"sales_price":8999,"stock":10,"sku":"SKU-001","description":"Description here","categories":["Category1"],"images":["https://..."]}[/ACTION]
- To add a category, respond with:
  [ACTION:add_category]{"name":"Category Name","description":"Optional description"}[/ACTION]
- To restock a product, respond with:
  [ACTION:restock]{"product_id":"the-product-id","quantity":10,"reason":"Restock reason"}[/ACTION]
- To adjust stock, respond with:
  [ACTION:adjust_stock]{"product_id":"the-product-id","stock":25,"reason":"Adjustment reason"}[/ACTION]

Only use ACTION blocks when the admin explicitly asks you to perform that action.
For informational queries (revenue, stock levels, descriptions), just answer directly.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function gatherStoreContext(): Promise<string> {
  const sections: string[] = [];

  try {
    const stats: Stats = await api.stats();
    sections.push(`STORE STATS:
- Total products: ${stats.total_products}
- Total categories: ${stats.total_categories}
- Total sales: ${stats.total_sales}
- Total revenue: KES ${stats.revenue.toLocaleString()}
- Today's sales: ${stats.today_sales}
- Today's revenue: KES ${stats.today_revenue.toLocaleString()}
- Low stock items: ${stats.low_stock}
- Out of stock items: ${stats.out_of_stock}`);
  } catch {
    sections.push("STORE STATS: Unable to fetch stats (backend may be offline).");
  }

  try {
    const products: Product[] = await api.products.list({ status: "active" });
    const productLines = products.map((p) => {
      const price = p.sales_price ?? p.price;
      return `  - ID: ${p.id} | ${p.name} | Price: KES ${price} | Stock: ${p.stock ?? 0} | Low threshold: ${p.low_stock_threshold ?? 5} | SKU: ${p.sku || "N/A"} | Categories: ${p.categories?.join(", ") || "N/A"} | Status: ${p.status || "active"}`;
    });
    sections.push(`PRODUCTS (${products.length} total):\n${productLines.join("\n")}`);
  } catch {
    sections.push("PRODUCTS: Unable to fetch products.");
  }

  try {
    const inventory: InventoryItem[] = await api.inventory.list();
    const lowStock = inventory.filter((i) => i.is_low);
    if (lowStock.length > 0) {
      const lowLines = lowStock.map((i) => `  - ${i.name} (ID: ${i.id}) | Stock: ${i.stock} | Threshold: ${i.low_stock_threshold} | SKU: ${i.sku || "N/A"}`);
      sections.push(`LOW STOCK ALERT (${lowStock.length} items below threshold):\n${lowLines.join("\n")}`);
    } else {
      sections.push("LOW STOCK: All products are above their low-stock thresholds.");
    }
    const outOfStock = inventory.filter((i) => i.stock === 0);
    if (outOfStock.length > 0) {
      const outLines = outOfStock.map((i) => `  - ${i.name} (ID: ${i.id}) | SKU: ${i.sku || "N/A"}`);
      sections.push(`OUT OF STOCK (${outOfStock.length} items):\n${outLines.join("\n")}`);
    }
  } catch {
    sections.push("INVENTORY: Unable to fetch inventory.");
  }

  try {
    const categories: Category[] = await api.categories.list();
    const catLines = categories.map((c) => `  - ID: ${c.id} | ${c.name} | Active: ${c.is_active ?? true}${c.description ? ` | ${c.description}` : ""}`);
    sections.push(`CATEGORIES (${categories.length} total):\n${catLines.join("\n")}`);
  } catch {
    sections.push("CATEGORIES: Unable to fetch categories.");
  }

  try {
    const sales: Sale[] = await api.sales.list();
    const recent = sales.slice(0, 10);
    const saleLines = recent.map((s) => `  - ${s.receipt_no} | Total: KES ${s.total.toLocaleString()} | Payment: ${s.payment_method} | Date: ${s.created_at} | Items: ${s.items?.length ?? 0}`);
    sections.push(`RECENT SALES (showing ${recent.length} of ${sales.length} total):\n${saleLines.join("\n")}`);
  } catch {
    sections.push("SALES: Unable to fetch sales.");
  }

  return `${BASE_PROMPT}\n\n=== LIVE STORE DATA ===\n${sections.join("\n\n")}`;
}

async function executeAction(action: string, data: Record<string, unknown>): Promise<string> {
  try {
    switch (action) {
      case "add_product": {
        const product = await api.products.create({
          name: String(data.name),
          price: Number(data.price),
          sales_price: data.sales_price ? Number(data.sales_price) : undefined,
          stock: data.stock ? Number(data.stock) : 0,
          sku: data.sku ? String(data.sku) : undefined,
          description: data.description ? String(data.description) : undefined,
          categories: Array.isArray(data.categories) ? data.categories as string[] : undefined,
          images: Array.isArray(data.images) ? data.images as string[] : undefined,
        });
        return `Product added successfully: ${product.name} (ID: ${product.id})`;
      }
      case "add_category": {
        const category = await api.categories.create({
          name: String(data.name),
          description: data.description ? String(data.description) : undefined,
        });
        return `Category added successfully: ${category.name} (ID: ${category.id})`;
      }
      case "restock": {
        const product = await api.inventory.restock(
          String(data.product_id),
          Number(data.quantity),
          data.reason ? String(data.reason) : "AI admin restock",
        );
        return `Restocked ${data.quantity} units of ${product.name}. New stock: ${product.stock}`;
      }
      case "adjust_stock": {
        const product = await api.inventory.adjust(
          String(data.product_id),
          Number(data.stock),
          data.reason ? String(data.reason) : "AI admin adjustment",
        );
        return `Stock adjusted for ${product.name}. New stock: ${product.stock}`;
      }
      default:
        return `Unknown action: ${action}`;
    }
  } catch (error) {
    return `Action failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

function extractActions(reply: string): { cleaned: string; actions: { action: string; data: Record<string, unknown> }[] } {
  const actions: { action: string; data: Record<string, unknown> }[] = [];
  const regex = /\[ACTION:(\w+)\]([\s\S]*?)\[\/ACTION\]/g;
  let match;
  let cleaned = reply;
  while ((match = regex.exec(reply)) !== null) {
    const action = match[1];
    try {
      const data = JSON.parse(match[2].trim());
      actions.push({ action, data });
    } catch {
      // ignore malformed JSON
    }
    cleaned = cleaned.replace(match[0], "");
  }
  return { cleaned: cleaned.trim(), actions };
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: unknown;
    messages?: ChatMessage[];
  };

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 3000) {
    return NextResponse.json(
      { error: "Enter a message between 1 and 3,000 characters." },
      { status: 400 },
    );
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Admin AI is not configured. Set DEEPSEEK_API_KEY." },
      { status: 503 },
    );
  }

  const systemPrompt = await gatherStoreContext();

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
        max_tokens: 1200,
        temperature: 0.5,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("DeepSeek API error:", res.status, errText);
      return NextResponse.json(
        { error: "I'm having trouble connecting right now." },
        { status: 502 },
      );
    }

    const data = await res.json();
    let reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    const { cleaned, actions } = extractActions(reply);

    const actionResults: string[] = [];
    for (const { action, data: actionData } of actions) {
      const result = await executeAction(action, actionData);
      actionResults.push(result);
    }

    if (actionResults.length > 0) {
      reply = `${cleaned}\n\n**Actions performed:**\n${actionResults.map((r) => `- ${r}`).join("\n")}`;
    } else {
      reply = cleaned;
    }

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("Admin agent request failed:", error);
    return NextResponse.json(
      { error: "I'm unavailable right now." },
      { status: 502 },
    );
  }
}
