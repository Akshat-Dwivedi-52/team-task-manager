import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth, isAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // 1. Fetch current task assignments to check permission
  const { data: assignments } = await supabaseAdmin
    .from("task_assignments")
    .select("user_id")
    .eq("task_id", id);

  const isAssigned = assignments?.some(asgn => asgn.user_id === auth.userId);
  const isUserAdmin = isAdmin(auth);

  if (!isAssigned && !isUserAdmin) {
    return NextResponse.json({ error: "Forbidden: You are not assigned to this task" }, { status: 403 });
  }

  try {
    const { assigned_to, ...updates } = await request.json();

    // 2. Update task fields (title, status, due_date)
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Update assignments if provided (Only Admin can reassign)
    if (assigned_to !== undefined && Array.isArray(assigned_to)) {
      if (!isUserAdmin) {
        return NextResponse.json({ error: "Forbidden: Only admins can reassign tasks" }, { status: 403 });
      }

      // Delete existing assignments
      await supabaseAdmin.from("task_assignments").delete().eq("task_id", id);

      // Add new ones
      if (assigned_to.length > 0) {
        const newAssignments = assigned_to.map(userId => ({
          task_id: id,
          user_id: userId
        }));
        await supabaseAdmin.from("task_assignments").insert(newAssignments);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth();
  if (!auth || !isAdmin(auth)) {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Task deleted" });
}
