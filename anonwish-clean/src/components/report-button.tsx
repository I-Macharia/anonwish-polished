"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/primitives";

export function ReportButton({ wishId }: { wishId: string }) {
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishId, reason: f.get("reason"), details: String(f.get("details") ?? "").trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return void toast.error(data.error ?? "Could not send report");
    toast.success("Thanks, our team will review this wish.");
    setOpen(false);
  }

  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)} className="text-xs">Report this wish</Button>;
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <Select name="reason" aria-label="Reason" className="w-auto"><option value="fraud">Looks fraudulent</option><option value="spam">Spam</option><option value="inappropriate">Inappropriate</option><option value="other">Other</option></Select>
      <Input name="details" aria-label="Details" placeholder="Details (optional)" maxLength={500} className="w-64" />
      <Button type="submit">Send</Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </form>
  );
}
