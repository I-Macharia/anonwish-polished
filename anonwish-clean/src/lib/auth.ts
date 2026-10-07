import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { supabaseServer } from "./supabase/server";

/** Current wisher/admin, creating the app-level row on first sign-in. Cached per request. */
export const getCurrentUser = cache(async () => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  let [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row) {
    [row] = await db
      .insert(users)
      .values({ id: user.id, email: user.email, name: (user.user_metadata?.name as string | undefined) ?? null })
      .onConflictDoNothing()
      .returning();
  }
  return row && !row.deletedAt ? row : null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") notFound();
  return user;
}
