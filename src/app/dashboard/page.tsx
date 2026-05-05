"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut, CheckCircle2, Circle, Calendar, User as UserIcon, Folder, Pencil, Trash2, LayoutDashboard, Clock, CheckCircle, X } from "lucide-react";

interface Project { id: string; name: string; description: string; }
interface Task { id: string; title: string; status: "Todo" | "Doing" | "Done"; due_date: string; assigned_to: { id: string; name: string }[]; project_id: { id: string; name: string } | null; }
interface User { id: string; name: string; email: string; role: "Admin" | "Member"; }
interface Member { id: string; name: string; role: string; }

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newTask, setNewTask] = useState({ title: "", project_id: "", assigned_to: [] as string[], due_date: "" });
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [user] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const d = localStorage.getItem("user");
      return d ? JSON.parse(d) : null;
    }
    return null;
  });
  const router = useRouter();

  const fetchData = useCallback(async (token: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, tRes, uRes] = await Promise.all([
        fetch("/api/projects", { headers }), fetch("/api/tasks", { headers }), fetch("/api/users", { headers }),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjects(pData);
        if (pData.length > 0) setNewTask(prev => ({ ...prev, project_id: prev.project_id || pData[0].id }));
      }
      if (tRes.ok) setTasks(await tRes.json());
      if (uRes.ok) setMembers(await uRes.json());
    } catch (err) { console.error("Error fetching data:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    const init = async () => { if (mounted) await fetchData(token); };
    init();
    return () => { mounted = false; };
  }, [router, fetchData]);

  const handleProjectClick = async (projectId: string | null) => {
    setSelectedProjectId(projectId);
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const url = projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTasks(await res.json());
    } catch (err) { console.error("Error fetching tasks:", err); }
    finally { setLoading(false); }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects";
      const res = await fetch(url, {
        method: editingProject ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        const data = await res.json();
        if (editingProject) setProjects(prev => prev.map(p => p.id === data.id ? data : p));
        else { setProjects(prev => [data, ...prev]); setNewTask(prev => ({ ...prev, project_id: data.id })); }
        setShowProjectModal(false); setEditingProject(null); setNewProject({ name: "", description: "" });
      } else { const data = await res.json(); alert(data.error || "Operation failed"); }
    } catch (err) { console.error("Error with project operation:", err); }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project and all its tasks?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setProjects(prev => prev.filter(p => p.id !== projectId)); if (selectedProjectId === projectId) handleProjectClick(null); }
    } catch (err) { console.error("Error deleting project:", err); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const res = await fetch(url, {
        method: editingTask ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        await fetchData(token);
        setShowModal(false); setEditingTask(null);
        setNewTask({ title: "", project_id: projects[0]?.id || "", assigned_to: [], due_date: "" });
      } else { const data = await res.json(); alert(data.error || "Operation failed"); }
    } catch (err) { console.error("Error with task operation:", err); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) { console.error("Error deleting task:", err); }
  };

  const handleStatusToggle = async (task: Task) => {
    const newStatus = task.status === "Done" ? "Todo" : "Done";
    const token = localStorage.getItem("token");
    if (!token) return;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
        const data = await res.json();
        if (data.error) alert(data.error);
      }
    } catch { setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t)); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); };

  const toggleAssignee = (userId: string) =>
    setNewTask(prev => ({ ...prev, assigned_to: prev.assigned_to.includes(userId) ? prev.assigned_to.filter(id => id !== userId) : [...prev.assigned_to, userId] }));

  const isOverdue = (date: string, status: string) => date && status !== "Done" && new Date(date) < new Date();

  const stats = { total: tasks.length, completed: tasks.filter(t => t.status === "Done").length, overdue: tasks.filter(t => isOverdue(t.due_date, t.status)).length };

  if (loading && projects.length === 0) return (
    <div className="loading-screen"><div className="spinner"></div><span>Loading your workspace...</span></div>
  );

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "8px" }}>
              <LayoutDashboard size={24} /> Manager
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginTop: "4px" }}>Welcome, {user?.name}</p>
          </div>
          {user?.role === "Admin" && (
            <button onClick={() => { setEditingProject(null); setNewProject({ name: "", description: "" }); setShowProjectModal(true); }} className="btn-icon" title="New Project">
              <Plus size={20} />
            </button>
          )}
        </div>

        <nav className="project-list">
          <div className={`project-item ${!selectedProjectId ? "project-item-active" : ""}`} onClick={() => handleProjectClick(null)}>
            <Folder size={18} style={{ marginRight: "10px" }} /> All Tasks
          </div>
          {projects.map(project => (
            <div key={project.id} className={`project-item ${selectedProjectId === project.id ? "project-item-active" : ""}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => handleProjectClick(project.id)}>
              <span style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <Folder size={18} style={{ marginRight: "10px" }} /> {project.name}
              </span>
              {user?.role === "Admin" && (
                <div style={{ display: "flex", gap: "4px" }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditingProject(project); setNewProject({ name: project.name, description: project.description }); setShowProjectModal(true); }} className="action-btn"><Pencil size={14} /></button>
                  <button onClick={() => handleDeleteProject(project.id)} className="action-btn delete"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </nav>
        <button className="logout-button" onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      <main className="main-content">
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-label">Total Tasks</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><LayoutDashboard size={24} color="var(--accent)" /><span className="stat-value">{stats.total}</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Completed</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><CheckCircle size={24} color="#10b981" /><span className="stat-value">{stats.completed}</span></div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Overdue</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}><Clock size={24} color="#ef4444" /><span className="stat-value" style={{ color: stats.overdue > 0 ? "#ef4444" : "inherit" }}>{stats.overdue}</span></div>
          </div>
        </div>

        <header className="section-header">
          <h1 style={{ fontSize: "1.875rem" }}>{selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : "Dashboard"}</h1>
          {user?.role === "Admin" && (
            <button className="btn" onClick={() => { setEditingTask(null); setNewTask({ title: "", project_id: projects[0]?.id || "", assigned_to: [], due_date: "" }); setShowModal(true); }}>
              <Plus size={18} style={{ marginRight: "8px" }} /> New Task
            </button>
          )}
        </header>

        <div className="task-list">
          {tasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-checkbox-container" onClick={() => handleStatusToggle(task)} style={{ cursor: "pointer" }}>
                {task.status === "Done" ? <CheckCircle2 size={24} color="var(--accent)" fill="var(--accent-foreground)" /> : <Circle size={24} color="var(--border)" />}
              </div>
              <div className="task-info">
                <div className="task-title" style={{ textDecoration: task.status === "Done" ? "line-through" : "none", color: task.status === "Done" ? "var(--muted-foreground)" : "var(--foreground)" }}>{task.title}</div>
                <div className="task-meta">
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <UserIcon size={14} /> {task.assigned_to.length > 0 ? task.assigned_to.map(u => u.name).join(", ") : "Unassigned"}
                  </span>
                  <span className={isOverdue(task.due_date, task.status) ? "overdue-text" : ""} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={14} /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No deadline"}
                  </span>
                  <span style={{ opacity: 0.7, display: "flex", alignItems: "center", gap: "6px" }}><Folder size={14} /> {task.project_id?.name}</span>
                </div>
              </div>
              {user?.role === "Admin" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setEditingTask(task); setNewTask({ title: task.title, project_id: task.project_id?.id || "", assigned_to: task.assigned_to.map(u => u.id), due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "" }); setShowModal(true); }} className="action-btn"><Pencil size={16} /></button>
                  <button onClick={() => handleDeleteTask(task.id)} className="action-btn delete"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          ))}
          {tasks.length === 0 && !loading && (
            <div className="empty-state">
              <p style={{ fontSize: "1.25rem", fontWeight: 600 }}>No tasks found</p>
              <p style={{ fontSize: "0.875rem" }}>Try selecting another project or create a new task.</p>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingTask(null); }}>
          <div className="modal-content" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0 }}>{editingTask ? "Edit Task" : "Create New Task"}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setEditingTask(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="label">Task Title</label>
                <input className="input-field" placeholder="What needs to be done?" required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Assign To (Multiple)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", backgroundColor: "var(--background)", maxHeight: "150px", overflowY: "auto" }}>
                  {members.map(member => (
                    <div key={member.id} onClick={() => toggleAssignee(member.id)}
                      style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "0.875rem", cursor: "pointer", transition: "all 0.2s",
                        backgroundColor: newTask.assigned_to.includes(member.id) ? "var(--accent)" : "white",
                        color: newTask.assigned_to.includes(member.id) ? "white" : "var(--foreground)",
                        border: "1px solid " + (newTask.assigned_to.includes(member.id) ? "var(--accent)" : "var(--border)") }}>
                      {member.name}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div className="form-group">
                  <label className="label">Project</label>
                  <select className="input-field" value={newTask.project_id} onChange={e => setNewTask({ ...newTask, project_id: e.target.value })} required>
                    <option value="" disabled>Select a project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Due Date</label>
                  <input type="date" className="input-field" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>{editingTask ? "Update Task" : "Create Task"}</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditingTask(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="modal-overlay" onClick={() => { setShowProjectModal(false); setEditingProject(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "1.5rem" }}>{editingProject ? "Edit Project" : "Create New Project"}</h2>
            <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="label">Project Name</label>
                <input className="input-field" placeholder="Project name" required value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <textarea className="input-field" placeholder="What is this project about?" rows={3} value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} style={{ resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>{editingProject ? "Update Project" : "Create Project"}</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowProjectModal(false); setEditingProject(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
