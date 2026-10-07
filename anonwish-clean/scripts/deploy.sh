#!/usr/bin/env bash
# Scripted deploy. Prereqs: `vercel login`, a Supabase production project, and .env.production
# filled in (copy .env.example). DATABASE_URL must be the Supabase *session* pooler or direct URL.
set -euo pipefail
[ -f .env.production ] || { echo "Missing .env.production"; exit 1; }
set -a; . ./.env.production; set +a
: "${DATABASE_URL:?}" "${NEXT_PUBLIC_SITE_URL:?}"

echo "1/4 Migrating database"; npm run db:migrate
echo "2/4 Applying RLS + storage bucket"; npm run db:harden
echo "3/4 Syncing env vars to Vercel"
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* || -z "$value" ]] && continue
  printf '%s' "$value" | vercel env add "$key" production --force >/dev/null
done < .env.production
echo "4/4 Deploying"; vercel --prod
echo "Next: register webhooks (see README 'Payment webhooks'), then: npm run admin:promote -- you@example.com"
