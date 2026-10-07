import type { Metadata } from "next";
import { WishForm } from "@/components/wish-form";
import { requireUser } from "@/lib/auth";
import { listCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Post a wish" };

export default async function NewWishPage() {
  await requireUser();
  return (
    <div>
      <h1 className="mb-6 text-center text-3xl font-bold">Post a wish</h1>
      <WishForm categories={await listCategories()} />
    </div>
  );
}
