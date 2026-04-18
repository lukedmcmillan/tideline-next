import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

export async function getEmailFromSession(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token?.email as string | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function getUserIdFromSession(req: NextRequest): Promise<string | null> {
  const email = await getEmailFromSession(req);
  if (!email) return null;

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  return data?.id ?? null;
}
