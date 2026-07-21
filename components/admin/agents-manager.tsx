"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Plus, Trash2, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AgentSession = {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
};

export function AgentsManager() {
  const [sessions, setSessions] = useState<AgentSession[]>([
    {
      id: "session-1",
      name: "Store Assistant",
      messages: [],
      createdAt: new Date().toISOString(),
    },
  ]);
  const [activeSession, setActiveSession] = useState<string>("session-1");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find((s) => s.id === activeSession);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  const sendMessage = async () => {
    if (!input.trim() || !currentSession) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    setInput("");
    setLoading(true);

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession ? { ...s, messages: [...s.messages, userMessage] } : s
      )
    );

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: activeSession,
          messages: [...currentSession.messages, userMessage],
        }),
      });
      const data = await res.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || data.reply || "I could not process that request.",
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession ? { ...s, messages: [...s.messages, assistantMessage] } : s
        )
      );
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I could not connect to the agent service.",
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession ? { ...s, messages: [...s.messages, errorMessage] } : s
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const addSession = () => {
    const id = `session-${Date.now()}`;
    setSessions([...sessions, { id, name: `Agent ${sessions.length + 1}`, messages: [], createdAt: new Date().toISOString() }]);
    setActiveSession(id);
  };

  const removeSession = (id: string) => {
    if (sessions.length === 1) return;
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (activeSession === id) setActiveSession(filtered[0].id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">AI Agents</h2>
          <p className="text-sm text-[#64748b]">Manage your store&apos;s AI assistants</p>
        </div>
        <Button onClick={addSession}>
          <Plus className="mr-2 h-4 w-4" /> New agent
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={`cursor-pointer transition ${activeSession === session.id ? "border-[#166534] bg-[#f0fdf4]" : "hover:border-[#166534]/30"}`}
            >
              <CardContent className="flex items-center justify-between p-3" onClick={() => setActiveSession(session.id)}>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#166534]" />
                  <span className="text-sm font-medium">{session.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeSession(session.id); }} className="text-[#94a3b8] hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="flex h-[500px] flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#166534]" />
              <CardTitle className="text-base">{currentSession?.name || "Agent"}</CardTitle>
              <Badge variant="secondary" className="ml-auto">{currentSession?.messages.length || 0} messages</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            {currentSession && currentSession.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Bot className="mx-auto h-12 w-12 text-[#cbd5e1]" />
                  <p className="mt-4 text-sm text-[#64748b]">Start a conversation with your AI agent.</p>
                  <p className="mt-1 text-xs text-[#94a3b8]">Ask about products, orders, inventory, and more.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentSession?.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-[#166534] text-white" : "bg-[#f0fdf4] text-[#0f172a]"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-[#f0fdf4] p-3 text-sm text-[#64748b]">Typing...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
