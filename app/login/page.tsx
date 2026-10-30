"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? `Login failed (${res.status})`);
      }

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">MKS</div>
          <div>
            <p className="brand-name">MKS CONCORD</p>
            <p className="brand-subtitle">LLP · DOCUMENT CONTROL</p>
          </div>
        </div>

        <h1 className="login-heading">Sign in</h1>
        <p className="login-sub">Access the invoice verification workspace.</p>

        <form onSubmit={handleLogin} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="email" className="login-label">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert" className="error-banner">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4m0 3h.01" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="primary-button login-submit"
          >
            {loading ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="login-footer">© MKS Concord LLP · Invoice verification workspace</p>
      </div>
    </main>
  );
}
