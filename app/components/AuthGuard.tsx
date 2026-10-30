"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) router.replace("/login");
        else setChecked(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!checked) {
    return (
      <main className="app-shell">
        <div className="main-column">
          <div className="dashboard-content" style={{ paddingTop: 60 }}>
            <div className="loading-panel">
              <span className="spinner" />
              <p className="text-sm text-slate-400">Verifying session...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
