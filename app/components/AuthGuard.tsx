"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const API_URL = "/api";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("auth_verified") === "1") {
      setChecked(true);
      return;
    }
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          sessionStorage.removeItem("auth_verified");
          router.replace("/login");
        } else {
          sessionStorage.setItem("auth_verified", "1");
          setChecked(true);
        }
      })
      .catch(() => {
        sessionStorage.removeItem("auth_verified");
        router.replace("/login");
      });
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
