"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Attachment { id?: string; product_id?: string; name?: string; title?: string; price?: number | string; image?: string }
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
    const history = lines.map((l) => ({ role: l.role, content: l.content }));
    setLines((current) => [...current, { role: "user", content: message }]);
    setLoading(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId, messages: history }),
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
        <section className="mb-3 flex h-[min(560px,72vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col border border-[#166534]/20 bg-[#f8faf5] shadow-[8px_8px_0_#166534]" aria-label="Shopping assistant">
          <header className="flex items-center justify-between border-b border-[#166534]/20 bg-[#166534] px-4 py-3">
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-white">Ask the shop</p><p className="mt-0.5 text-[10px] text-[#dcfce7]/80">Product-aware customer agent</p></div>
            <button type="button" onClick={() => setOpen(false)} className="p-2 text-lg leading-none" aria-label="Close assistant">×</button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {lines.map((line, index) => <div key={`${line.role}-${index}`} className={`max-w-[88%] px-3 py-2 text-sm leading-6 ${line.role === "user" ? "ml-auto bg-[#166534] text-white" : "border border-[#166534]/20 bg-white"}`}><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} className="font-bold underline" target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{children}</a>, ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>, ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>, p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p> }}>{line.content}</ReactMarkdown>{line.attachments?.map((item) => { const id = item.product_id || item.id; return id ? <Link key={id} href={`/products/${id}`} className="mt-2 flex items-center gap-3 rounded-xl border border-[#166534]/20 bg-[#f8faf5] p-2 hover:bg-[#dcfce7] text-[#0f172a] transition-colors">{item.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.image} alt={item.name || "Product"} className="h-12 w-12 shrink-0 rounded-lg object-contain bg-white" />}<div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.name || item.title || "View product"}</p>{item.price !== undefined && <p className="text-[10px] font-semibold text-[#147243]">{item.price} KES</p>}</div><span className="text-xs text-[#147243]">→</span></Link> : null; })}</div>)}
            {loading && <div className="flex gap-1 p-2" aria-label="Assistant is replying"><span className="h-2 w-2 animate-pulse rounded-full bg-[#166534]"/><span className="h-2 w-2 animate-pulse rounded-full bg-[#166534] [animation-delay:150ms]"/><span className="h-2 w-2 animate-pulse rounded-full bg-[#166534] [animation-delay:300ms]"/></div>}
          </div>
          <form onSubmit={submit} className="flex border-t border-[#166534]/20 bg-white">
            <label htmlFor="agent-message" className="sr-only">Your question</label>
            <input id="agent-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="Ask about a product…" className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-[#0f172a]/40" />
            <button type="submit" disabled={loading} className="bg-[#166534] px-5 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-[#14532d] transition-colors disabled:opacity-50">Send</button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} className="ml-auto block border border-[#166534] bg-[#166534] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[5px_5px_0_#22c55e] transition-transform hover:-translate-y-0.5" aria-expanded={open}>
        {open ? "Close" : "Ask the shop"}
      </button>
    </div>
  );
}
