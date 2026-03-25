import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function getEmailFromSession(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token?.email as string | null;
}
