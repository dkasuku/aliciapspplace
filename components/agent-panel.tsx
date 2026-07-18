"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Attachment { id?: string; product_id?: string; name?: string; title?: string; price?: number | string }
interface ChatLine { role: "user" | "assistant"; content: string; attachments?: Attachment[] }

export function AgentPanel({ storeName }: { storeName: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([
    { role: "assistant", content: `Hi — I’m the ${storeName} shopping guide. What can I help you find?` },
  ]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setLines((current) => [...current, { role: "user", content: message }]);
    setLoading(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The shopping guide is unavailable.");
      setSessionId(payload.session_id);
      setLines((current) => [...current, { role: "assistant", content: payload.message, attachments: payload.attachments }]);
    } catch (error) {
      setLines((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 flex h-[min(560px,72vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col border border-[#171811] bg-[#f4f0e8] shadow-[8px_8px_0_#171811]" aria-label="Shopping assistant">
          <header className="flex items-center justify-between border-b border-[#171811] bg-[#d9ff43] px-4 py-3">
            <div><p className="text-xs font-black uppercase tracking-[0.16em]">Ask the shop</p><p className="mt-0.5 text-[10px]">Product-aware customer agent</p></div>
            <button type="button" onClick={() => setOpen(false)} className="p-2 text-lg leading-none" aria-label="Close assistant">×</button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {lines.map((line, index) => <div key={`${line.role}-${index}`} className={`max-w-[88%] px-3 py-2 text-sm leading-6 ${line.role === "user" ? "ml-auto bg-[#171811] text-white" : "border border-[#171811]/20 bg-white"}`}><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} className="font-bold underline" target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{children}</a>, ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>, ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>, p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p> }}>{line.content}</ReactMarkdown>{line.attachments?.map((item) => { const id = item.product_id || item.id; return id ? <Link key={id} href={`/products/${id}`} className="mt-2 block border border-[#171811] bg-[#f4f0e8] p-3 font-bold hover:bg-[#d9ff43]">{item.name || item.title || "View product"}{item.price !== undefined ? ` · ${item.price}` : ""} →</Link> : null; })}</div>)}
            {loading && <div className="flex gap-1 p-2" aria-label="Assistant is replying"><span className="h-2 w-2 animate-pulse rounded-full bg-[#171811]"/><span className="h-2 w-2 animate-pulse rounded-full bg-[#171811] [animation-delay:150ms]"/><span className="h-2 w-2 animate-pulse rounded-full bg-[#171811] [animation-delay:300ms]"/></div>}
          </div>
          <form onSubmit={submit} className="flex border-t border-[#171811] bg-white">
            <label htmlFor="agent-message" className="sr-only">Your question</label>
            <input id="agent-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Ask about a product…" className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-[#171811]/40" />
            <button type="submit" disabled={loading} className="bg-[#ec4b24] px-5 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-50">Send</button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} className="ml-auto block border border-[#171811] bg-[#171811] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[5px_5px_0_#ec4b24] transition-transform hover:-translate-y-0.5" aria-expanded={open}>
        {open ? "Close" : "Ask the shop"}
      </button>
    </div>
  );
}
