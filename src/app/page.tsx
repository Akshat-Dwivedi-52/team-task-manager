import Link from "next/link";

export default function Home() {
  return (
    <main className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h1 className="auth-title">Team Task Manager</h1>
        <p className="auth-subtitle">A modern and intuitive way to manage your team tasks with ease.</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.5rem" }}>
          <Link href="/login" className="btn" style={{ minWidth: "120px" }}>Log In</Link>
          <Link href="/signup" className="btn btn-outline" style={{ minWidth: "120px" }}>Sign Up</Link>
        </div>
      </div>
    </main>
  );
}
