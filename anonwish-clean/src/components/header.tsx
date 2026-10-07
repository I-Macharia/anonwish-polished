import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonStyles } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";

export async function Header() {
  const user = await getCurrentUser();
  const link = "rounded-md px-2.5 py-1.5 text-sm hover:bg-muted transition";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3" aria-label="Main">
        <Link href="/" className="text-lg font-semibold tracking-tight hover:opacity-90">
          AnonWish
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-sm">
          <Link href="/wishes" className={link}>Browse</Link>
          {user && <Link href="/dashboard" className={link}>My wishes</Link>}
          {user?.role === "admin" && <Link href="/admin" className={link}>Admin</Link>}
          {user ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className={link}>Sign out</button>
            </form>
          ) : (
            <Link href="/login" className={link}>Sign in</Link>
          )}
          <Link href="/wishes/new" className={buttonStyles("default", "ml-1")}>Post a wish</Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
