"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CURRENCIES } from "@/lib/validation";
import { Button } from "./ui/button";
import { Input, Label, Select, Textarea } from "./ui/primitives";

export type WishFormInitial = {
  title: string; description: string; categoryId: number; estimatedMin: number; estimatedMax: number;
  currency: string; urgency: string; imageUrls: string[];
};

export function WishForm({ categories, initial, wishId }: { categories: { id: number; name: string }[]; initial?: WishFormInitial; wishId?: string }) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(initial?.imageUrls ?? []);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (images.length >= 3) return void toast.error("Up to 3 images");
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(data.error ?? "Upload failed");
      setImages((prev) => [...prev, data.url]);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch(wishId ? `/api/wishes/${wishId}` : "/api/wishes", {
      method: wishId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(f), imageUrls: images }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return void toast.error(data.error ?? "Could not save your wish");
    toast.success(wishId ? "Wish updated" : "Wish published");
    router.push(`/wishes/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <div><Label htmlFor="title">Title</Label><Input id="title" name="title" required minLength={5} maxLength={120} defaultValue={initial?.title} /></div>
      <div>
        <Label htmlFor="description">What do you need, and why?</Label>
        <Textarea id="description" name="description" required minLength={30} maxLength={3000} defaultValue={initial?.description} />
        <p className="mt-1 text-xs text-muted-foreground">Do not include links, phone numbers, emails or requests to be contacted elsewhere.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" required defaultValue={initial?.categoryId}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="urgency">Urgency</Label>
          <Select id="urgency" name="urgency" defaultValue={initial?.urgency ?? "medium"}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label htmlFor="currency">Currency</Label>
          <Select id="currency" name="currency" defaultValue={initial?.currency ?? "USD"}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></div>
        <div><Label htmlFor="estimatedMin">Estimated min</Label><Input id="estimatedMin" name="estimatedMin" type="number" min="1" step="any" required defaultValue={initial?.estimatedMin} /></div>
        <div><Label htmlFor="estimatedMax">Estimated max</Label><Input id="estimatedMax" name="estimatedMax" type="number" min="1" step="any" required defaultValue={initial?.estimatedMax} /></div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">A donor funds the maximum amount to fulfil your wish completely.</p>
      <div>
        <Label htmlFor="images">Images (optional, up to 3, 2 MB each)</Label>
        <Input id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => upload(e.target.files)} />
        <div className="mt-2 flex gap-2">
          {images.map((u) => (
            <button key={u} type="button" onClick={() => setImages((p) => p.filter((x) => x !== u))} aria-label="Remove image" title="Click to remove">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-16 w-16 rounded object-cover" />
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : wishId ? "Save changes" : "Publish wish"}</Button>
    </form>
  );
}
