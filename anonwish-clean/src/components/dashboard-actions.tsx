"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/button";

async function call(url: string, method: string): Promise<boolean> {
  const res = await fetch(url, { method });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) toast.error(data.error ?? "Request failed");
  return res.ok;
}

export function DeleteWishButton({ wishId }: { wishId: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      className="text-red-600"
      onClick={async () => {
        if (!confirm("Delete this wish?")) return;
        if (await call(`/api/wishes/${wishId}`, "DELETE")) {
          toast.success("Wish deleted");
          router.refresh();
        }
      }}
    >
      Delete
    </Button>
  );
}

export function DeleteAccountButton() {
  return (
    <Button
      variant="destructive"
      onClick={async () => {
        if (!confirm("Permanently delete your account and personal data? This cannot be undone.")) return;
        if (await call("/api/account", "DELETE")) window.location.assign("/");
      }}
    >
      Delete my account and data
    </Button>
  );
}
