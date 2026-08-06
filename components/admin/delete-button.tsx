"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Row delete used across the admin tables. Confirms first, reports the failure
 * rather than swallowing it, and only tells the parent to drop the row once the
 * server has actually accepted the deletion.
 */
export function DeleteButton({
  onDelete,
  label = "this entry",
  size = "icon",
}: {
  onDelete: () => Promise<void> | void;
  label?: string;
  size?: "icon" | "sm";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Delete failed.";
      setError(message);
      alert(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => void run()}
      disabled={busy}
      title={error || `Delete ${label}`}
      aria-label={`Delete ${label}`}
    >
      <Trash2 className={`h-4 w-4 ${busy ? "opacity-40" : "text-red-600"}`} />
      {size === "sm" && <span className="ml-1">{busy ? "Deleting…" : "Delete"}</span>}
    </Button>
  );
}
