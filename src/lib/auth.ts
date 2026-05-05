import { headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export interface AuthPayload { userId: string; role: "Admin" | "Member"; }

export async function verifyAuth(): Promise<AuthPayload | null> {
  const authHeader = (await headers()).get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try { return jwt.verify(authHeader.split(" ")[1], JWT_SECRET) as AuthPayload; }
  catch { return null; }
}

export const isAdmin = (p: AuthPayload | null) => p?.role === "Admin";
