"use client";
import { useState } from "react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Input, Label } from "./ui/primitives";

export function LoginForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function magicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const email = String(new FormData(e.currentTarget).get("email"));
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setBusy(false);
    if (error) return void toast.error(error.message);
    setSent(true);
  }

  if (sent) return <p role="status">Check your inbox for a sign-in link.</p>;
  return (
    <div className="space-y-4">
      <form onSubmit={magicLink} className="space-y-3">
        <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Sending…" : "Email me a sign-in link"}</Button>
      </form>
      {googleEnabled && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } })}
        >
          Continue with Google
        </Button>
      )}
    </div>
  );
}
