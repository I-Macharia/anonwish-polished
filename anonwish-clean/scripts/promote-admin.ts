import postgres from "postgres";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run admin:promote -- you@example.com (user must have signed in once)");
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL!);
const rows = await sql`update users set role = 'admin' where email = ${email} returning email`;
console.log(rows.length ? `Promoted ${email} to admin` : `No user found for ${email}. Sign in once first.`);
await sql.end();
