import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { wishes } from "@/db/schema";
import { WishForm } from "@/components/wish-form";
import { requireUser } from "@/lib/auth";
import { listCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit wish" };

export default async function EditWishPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [w] = await db
    .select()
    .from(wishes)
    .where(and(eq(wishes.id, id), eq(wishes.userId, user.id), isNull(wishes.deletedAt)))
    .limit(1);
  if (!w || w.status !== "open") notFound();
  return (
    <div>
      <h1 className="mb-6 text-center text-3xl font-bold">Edit wish</h1>
      <WishForm
        wishId={w.id}
        categories={await listCategories()}
        initial={{
          title: w.title, description: w.description, categoryId: w.categoryId,
          estimatedMin: w.estimatedMin / 100, estimatedMax: w.estimatedMax / 100,
          currency: w.currency, urgency: w.urgency, imageUrls: w.imageUrls,
        }}
      />
    </div>
  );
}
