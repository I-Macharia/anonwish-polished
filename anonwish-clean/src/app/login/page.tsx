import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/dashboard";
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Sign in to post a wish</h1>
      <p className="text-sm text-muted-foreground">Wishers need an account. Donors never do.</p>
      {sp.error && <p role="alert" className="text-sm text-red-600">Sign-in failed. Please try again.</p>}
      <LoginForm next={next} googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true"} />
    </div>
  );
}
