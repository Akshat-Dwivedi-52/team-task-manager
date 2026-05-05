import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";

interface TaskAssignment { user_id: string | number; users: { id: string | number; name: string }; }
interface TaskRow {
  id: string; project_id: { name: string }; task_assignments: TaskAssignment[];
  title: string; status: string; due_date: string | null; created_at: string;
}

export async function GET(request: Request) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = new URL(request.url).searchParams.get("projectId");
  let query = supabaseAdmin.from("tasks").select(`*, project_id(name), task_assignments(user_id, users(id, name))`);
  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let filtered = data as TaskRow[];
  if (auth.role !== "Admin")
    filtered = filtered.filter(t => t.task_assignments?.some(a => a.user_id === auth.userId));

  return NextResponse.json(filtered.map(t => ({ ...t, assigned_to: t.task_assignments?.map(a => a.users) || [] })));
}

export async function POST(request: Request) {
  const auth = await verifyAuth();
  if (!auth || auth.role !== "Admin")
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

  try {
    const { project_id, assigned_to, title, status, due_date } = await request.json();
    if (!project_id || !title)
      return NextResponse.json({ error: "Project and title are required" }, { status: 400 });

    const { data: task, error: taskError } = await supabaseAdmin
      .from("tasks").insert([{ project_id, title, status: status || "Todo", due_date }]).select().single();
    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });

    if (assigned_to?.length > 0) {
      const { error: asgnError } = await supabaseAdmin
        .from("task_assignments").insert(assigned_to.map((userId: string) => ({ task_id: task.id, user_id: userId })));
      if (asgnError) console.error("Assignment error:", asgnError);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
