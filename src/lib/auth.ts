import { headers } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export interface AuthPayload {
  userId: string;
  role: "Admin" | "Member";
}

export async function verifyAuth(): Promise<AuthPayload | null> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function isAdmin(payload: AuthPayload | null): boolean {
  return payload?.role === "Admin";
}
