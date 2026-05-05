import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await verifyAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  // Query tasks with their assignments
  // We join task_assignments and then users to get names
  let query = supabaseAdmin
    .from("tasks")
    .select(`
      *,
      project_id(name),
      task_assignments(
        user_id,
        users(id, name)
      )
    `);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface TaskAssignment {
    user_id: string | number;
    users: { id: string | number; name: string };
  }

  interface TaskRow {
    id: string;
    project_id: { name: string };
    task_assignments: TaskAssignment[];
    title: string;
    status: string;
    due_date: string | null;
    created_at: string;
  }

  // Filter tasks based on visibility rule: Admin sees all, Members see only assigned tasks
  let filteredData = data as TaskRow[];
  if (auth.role !== "Admin") {
    filteredData = filteredData.filter((task) => 
      task.task_assignments?.some((asgn) => asgn.user_id === auth.userId)
    );
  }

  // Transform data to a cleaner format for frontend
  const transformedData = filteredData.map((task) => ({
    ...task,
    assigned_to: task.task_assignments?.map((asgn) => asgn.users) || []
  }));

  return NextResponse.json(transformedData);
}

export async function POST(request: Request) {
  const auth = await verifyAuth();
  
  if (!auth || auth.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const { project_id, assigned_to, title, status, due_date } = await request.json();

    if (!project_id || !title) {
      return NextResponse.json({ error: "Project and title are required" }, { status: 400 });
    }

    // 1. Create the task
    const { data: task, error: taskError } = await supabaseAdmin
      .from("tasks")
      .insert([
        {
          project_id,
          title,
          status: status || "Todo",
          due_date,
        },
      ])
      .select()
      .single();

    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 });
    }

    // 2. Create assignments if provided
    // assigned_to is expected to be an array of user IDs
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      const assignments = assigned_to.map(userId => ({
        task_id: task.id,
        user_id: userId
      }));

      const { error: asgnError } = await supabaseAdmin
        .from("task_assignments")
        .insert(assignments);

      if (asgnError) {
        // Rollback task? For now just log, DB integrity handles deletes if task removed
        console.error("Assignment error:", asgnError);
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
