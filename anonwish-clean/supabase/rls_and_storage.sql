-- Run after `npm run db:migrate`. Idempotent.
-- The app connects to Postgres directly (service role), which bypasses RLS.
-- Enabling RLS with NO policies means the public Supabase REST/GraphQL API (anon key)
-- can read nothing, so donor data cannot leak through that side door.
alter table users enable row level security;
alter table categories enable row level security;
alter table wishes enable row level security;
alter table fulfillments enable row level security;
alter table donor_receipts enable row level security;
alter table reports enable row level security;
alter table admin_logs enable row level security;

-- Public image bucket; uploads happen server-side only (no insert policies for anon/authenticated).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wish-images', 'wish-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
