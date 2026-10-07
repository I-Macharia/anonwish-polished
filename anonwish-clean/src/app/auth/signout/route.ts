import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/http";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("Forbidden", { status: 403 });
  await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
