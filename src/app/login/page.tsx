"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to your account to continue</p>
        {error && <div className="error-box">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="email">Email Address</label>
            <input className="input-field" type="email" id="email" name="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input className="input-field" type="password" id="password" name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <div className="auth-footer">
          Don&apos;t have an account? <Link href="/signup" className="auth-link">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
