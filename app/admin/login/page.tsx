"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Phoneplacelg.png" alt="Alicia Phone Place" className="mx-auto h-20 w-auto object-contain" />
          <h1 className="mt-6 font-display text-2xl font-black text-[#0f172a]">Admin Login</h1>
          <p className="mt-2 text-sm text-[#64748b]">Enter your password to access the admin panel</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#dbe6dd] bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a]/80">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="mt-2 w-full rounded-lg border border-[#166534]/30 bg-white p-4 text-sm text-[#0f172a] focus:outline-none focus:border-[#166534]"
              placeholder="Enter admin password"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-[#166534] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#14532d] disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#94a3b8]">
          Alicia Phone Place · Admin Panel
        </p>
      </div>
    </main>
  );
}
