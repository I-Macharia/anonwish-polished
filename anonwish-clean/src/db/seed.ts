import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { categories, users, wishes } from "./schema";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

const CATS = [
  ["education", "Education"], ["tech", "Tech & Devices"], ["health", "Health & Wellness"],
  ["home", "Home & Family"], ["work", "Tools & Livelihood"], ["creative", "Creative"],
] as const;

// [title, description, category slug, min, max, currency, urgency]; amounts in major units
const W: [string, string, string, number, number, string, "low" | "medium" | "high"][] = [
  ["Laptop for coding bootcamp", "My old laptop died. I need a basic laptop to finish my bootcamp and start freelancing.", "tech", 300, 450, "USD", "high"],
  ["Sewing machine for my tailoring shop", "I sew by hand for customers. A machine would triple my output.", "work", 120, 200, "USD", "medium"],
  ["Textbooks for first-year nursing", "Required texts for the semester are beyond my budget.", "education", 80, 150, "USD", "high"],
  ["Prescription glasses", "I struggle to read at work and need a new prescription.", "health", 50, 90, "USD", "medium"],
  ["Second-hand fridge for my family", "Ours broke and food spoils within a day.", "home", 150, 250, "USD", "high"],
  ["Camera lens for photojournalism", "A 50mm lens would let me shoot low-light community stories.", "creative", 100, 220, "USD", "low"],
  ["Smartphone for online classes", "My cracked phone cannot run video calls.", "tech", 120, 200, "USD", "medium"],
  ["Safety boots for site work", "I start a construction job Monday and cannot afford boots.", "work", 30, 60, "USD", "high"],
  ["School uniforms for two children", "Two kids start term next week without uniforms.", "education", 40, 80, "USD", "high"],
  ["Guitar for youth music group", "Our community group shares one broken guitar.", "creative", 80, 150, "USD", "low"],
  ["Water filter for our household", "We boil water daily with charcoal; a filter would help.", "home", 30, 70, "USD", "medium"],
  ["Blood pressure monitor for my mother", "She needs daily checks and clinic trips are costly.", "health", 25, 50, "USD", "medium"],
];

async function main() {
  await db.insert(categories).values(CATS.map(([slug, name]) => ({ slug, name }))).onConflictDoNothing();
  const cats = await db.select().from(categories);
  const bySlug = new Map(cats.map((c) => [c.slug, c.id]));

  const seedUserId = "00000000-0000-0000-0000-000000000001";
  await db.insert(users).values({ id: seedUserId, email: "seed@anonwish.local", name: "Sample Wisher" }).onConflictDoNothing();

  await db.insert(wishes).values(
    W.map(([title, description, cat, min, max, currency, urgency]) => ({
      userId: seedUserId, title, description, urgency, currency,
      categoryId: bySlug.get(cat)!, estimatedMin: min * 100, estimatedMax: max * 100,
    })),
  );
  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
