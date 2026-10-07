import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border py-10 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md space-y-2">
          <p className="font-medium text-foreground">AnonWish</p>
          <p>
            A gifting platform, not a bank. Funds are held only until a wish is fulfilled or refunded. Donors remain anonymous to wishers and the public.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/wishes" className="hover:text-foreground hover:underline">Browse</Link>
          <Link href="/wishes/new" className="hover:text-foreground hover:underline">Post a wish</Link>
          <Link href="/terms" className="hover:text-foreground hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy</Link>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-4 text-xs">
        © {new Date().getFullYear()} AnonWish. All rights reserved.
      </div>
    </footer>
  );
}
