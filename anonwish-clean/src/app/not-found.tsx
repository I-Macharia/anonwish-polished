import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 text-5xl" aria-hidden>🔍</div>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you are looking for does not exist or may have been removed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/wishes" className={buttonStyles("default")}>
          Browse wishes
        </Link>
        <Link href="/" className={buttonStyles("outline")}>
          Go home
        </Link>
      </div>
    </div>
  );
}
