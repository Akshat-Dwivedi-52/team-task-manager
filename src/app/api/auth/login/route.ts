import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabase";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const { data: user, error } = await supabaseAdmin.from("users").select("*").eq("email", email).single();
    if (error || !user)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    if (!(await bcrypt.compare(password, user.password)))
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    const userWithoutPassword = { ...user } as { [key: string]: unknown };
    delete userWithoutPassword.password;
    return NextResponse.json({ user: userWithoutPassword, token }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unknown error occurred" }, { status: 500 });
  }
}
