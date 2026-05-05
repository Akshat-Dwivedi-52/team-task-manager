import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password)
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });

    const { data: existingUser } = await supabaseAdmin.from("users").select("id").eq("email", email).single();
    if (existingUser)
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([{ name, email, password: hashedPassword, role: role || "Member" }])
      .select("id, name, email, role, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unknown error occurred" }, { status: 500 });
  }
}
