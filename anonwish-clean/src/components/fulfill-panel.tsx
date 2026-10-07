"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, Input, Label, Textarea } from "./ui/primitives";

export function FulfillPanel({ wishId, amountLabel, needsPhone }: { wishId: string; amountLabel: string; needsPhone: boolean }) {
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim() || undefined;
    setBusy(true);
    const res = await fetch("/api/fulfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishId, privateMessage: get("privateMessage"), receiptEmail: get("receiptEmail"), phone: get("phone") }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Could not start payment");
      setBusy(false);
      return;
    }
    window.location.assign(data.redirectUrl);
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Fulfil this wish anonymously</h2>
      <p className="mt-1 text-sm text-muted-foreground">Your name is never shown to the wisher or the public. Amount: {amountLabel}.</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        {needsPhone && (
          <div>
            <Label htmlFor="phone">M-Pesa phone number</Label>
            <Input id="phone" name="phone" type="tel" placeholder="0712345678" required />
          </div>
        )}
        <div>
          <Label htmlFor="privateMessage">Private thank-you message (optional)</Label>
          <Textarea id="privateMessage" name="privateMessage" maxLength={500} className="min-h-20" />
        </div>
        <div>
          <Label htmlFor="receiptEmail">Email for a receipt only (optional)</Label>
          <Input id="receiptEmail" name="receiptEmail" type="email" />
          <p className="mt-1 text-xs text-muted-foreground">Encrypted, never shown to the wisher, and deleted once your receipt is sent.</p>
        </div>
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Redirecting…" : "Fulfil anonymously"}</Button>
      </form>
    </Card>
  );
}
