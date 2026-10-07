import {
  pgTable, pgEnum, uuid, text, integer, serial, timestamp, jsonb, index, uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["wisher", "admin"]);
export const wishStatusEnum = pgEnum("wish_status", ["open", "funded", "fulfilled", "cancelled", "expired"]);
export const urgencyEnum = pgEnum("urgency", ["low", "medium", "high"]);
export const providerEnum = pgEnum("payment_provider", ["stripe", "flutterwave", "paystack", "mpesa"]);
export const fulfillmentStatusEnum = pgEnum("fulfillment_status", ["pending", "paid", "failed", "refunded"]);
export const reportStatusEnum = pgEnum("report_status", ["open", "actioned", "dismissed"]);

// id mirrors Supabase auth.users.id
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: roleEnum("role").notNull().default("wisher"),
  country: text("country"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

// Money is stored in minor units (cents, KES cents, kobo).
export const wishes = pgTable("wishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  estimatedMin: integer("estimated_min").notNull(),
  estimatedMax: integer("estimated_max").notNull(),
  currency: text("currency").notNull().default("USD"),
  urgency: urgencyEnum("urgency").notNull().default("medium"),
  status: wishStatusEnum("status").notNull().default("open"),
  imageUrls: text("image_urls").array().notNull().default([]),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("wishes_status_created_idx").on(t.status, t.createdAt),
  index("wishes_category_idx").on(t.categoryId),
]);

// ANONYMITY: no donor PII here. Public/wisher queries must never join donor_receipts.
export const fulfillments = pgTable("fulfillments", {
  id: uuid("id").primaryKey().defaultRandom(),
  wishId: uuid("wish_id").notNull().references(() => wishes.id),
  provider: providerEnum("provider").notNull(),
  providerRef: text("provider_ref").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  donorTokenHash: text("donor_token_hash").notNull(),
  privateMessage: text("private_message"),
  status: fulfillmentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("fulfillments_provider_ref_idx").on(t.provider, t.providerRef)]);

// Receipt-only; encrypted at rest; service-role access only (no RLS policy for anon/authenticated).
export const donorReceipts = pgTable("donor_receipts", {
  fulfillmentId: uuid("fulfillment_id").primaryKey().references(() => fulfillments.id, { onDelete: "cascade" }),
  emailEncrypted: text("email_encrypted").notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  wishId: uuid("wish_id").notNull().references(() => wishes.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: reportStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
