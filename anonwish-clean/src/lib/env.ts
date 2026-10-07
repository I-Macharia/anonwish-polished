export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const siteUrl = (): string => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
