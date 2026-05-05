import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth, isAdmin } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAuth();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: assignments } = await supabaseAdmin.from("task_assignments").select("user_id").eq("task_id", id);
  const isAssigned = assignments?.some(a => a.user_id === auth.userId);
  const isUserAdmin = isAdmin(auth);
  if (!isAssigned && !isUserAdmin)
    return NextResponse.json({ error: "Forbidden: You are not assigned to this task" }, { status: 403 });

  try {
    const { assigned_to, ...updates } = await request.json();
    const { data, error } = await supabaseAdmin.from("tasks").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (assigned_to !== undefined && Array.isArray(assigned_to)) {
      if (!isUserAdmin)
        return NextResponse.json({ error: "Forbidden: Only admins can reassign tasks" }, { status: 403 });
      await supabaseAdmin.from("task_assignments").delete().eq("task_id", id);
      if (assigned_to.length > 0)
        await supabaseAdmin.from("task_assignments").insert(assigned_to.map((userId: string) => ({ task_id: id, user_id: userId })));
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await verifyAuth();
  if (!auth || !isAdmin(auth))
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  const { id } = await params;

  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Task deleted" });
}
