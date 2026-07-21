"use client";

import { type FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, X, Send } from "lucide-react";

interface ChatLine {
  role: "user" | "assistant";
  content: string;
}

export function AdminAgentPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([
    {
      role: "assistant",
      content: "Hi! I'm your admin AI assistant. I can help you manage products, categories, inventory, check revenue, identify low stock, and guide you through the admin panel. What do you need?",
    },
  ]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    setInput("");
    setLines((current) => [...current, { role: "user", content: message }]);
    setLoading(true);
    try {
      const priorMessages = lines
        .filter((l) => l.role === "user" || l.role === "assistant")
        .slice(-10)
        .map((l) => ({ role: l.role, content: l.content }));

      const response = await fetch("/api/admin-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, messages: priorMessages }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Admin assistant is unavailable.");
      setLines((current) => [...current, { role: "assistant", content: payload.message }]);
    } catch (error) {
      setLines((current) => [
        ...current,
        { role: "assistant", content: error instanceof Error ? error.message : "Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(600px,80vh)] w-[min(420px,calc(100vw-2.5rem))] flex-col rounded-2xl border border-[#166534]/20 bg-white shadow-2xl">
          <header className="flex items-center justify-between rounded-t-2xl border-b border-[#166534]/15 bg-[#166534] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-white" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white">Admin Assistant</p>
                <p className="mt-0.5 text-[10px] text-[#dcfce7]/80">Store management AI</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-white hover:bg-white/10"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {lines.map((line, index) => (
              <div
                key={`${line.role}-${index}`}
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-6 ${
                  line.role === "user"
                    ? "ml-auto bg-[#166534] text-white"
                    : "border border-[#166534]/15 bg-[#f8faf5]"
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} className="font-bold underline" target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                        {children}
                      </a>
                    ),
                    ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
                    ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    table: ({ children }) => <table className="my-2 w-full border-collapse text-xs">{children}</table>,
                    th: ({ children }) => <th className="border border-[#166534]/20 bg-[#dcfce7] px-2 py-1 text-left font-bold">{children}</th>,
                    td: ({ children }) => <td className="border border-[#166534]/20 px-2 py-1">{children}</td>,
                    code: ({ children }) => <code className="rounded bg-[#166534]/10 px-1 py-0.5 text-xs font-mono">{children}</code>,
                    strong: ({ children }) => <strong className="font-bold text-[#0f172a]">{children}</strong>,
                  }}
                >
                  {line.content}
                </ReactMarkdown>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 p-2" aria-label="Assistant is replying">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#166534]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#166534] [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#166534] [animation-delay:300ms]" />
              </div>
            )}
          </div>

          <form onSubmit={submit} className="flex border-t border-[#166534]/15 bg-white p-2">
            <label htmlFor="admin-agent-message" className="sr-only">Your question</label>
            <input
              id="admin-agent-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={3000}
              placeholder="Ask about stock, revenue, add products..."
              className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[#0f172a]/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="ml-2 flex items-center gap-1.5 rounded-lg bg-[#166534] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#14532d] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#166534] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg transition-transform hover:-translate-y-0.5"
        >
          <Bot className="h-4 w-4" />
          Admin AI
        </button>
      )}
    </>
  );
}
