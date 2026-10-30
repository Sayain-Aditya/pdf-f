"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "/api";

export default function MobileNav({ active }: { active: "compare" | "report" | "reports" }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  async function handleLogout() {
    await fetch(`/api/auth/logout`, { method: "POST", credentials: "include" });
    sessionStorage.removeItem("auth_verified");
    router.replace("/login");
  }

  return (
    <>
      <nav className="mobile-nav-bar">
        <div className="mobile-brand">
          <div className="mobile-brand-mark">MKS</div>
          <span className="mobile-brand-name">MKS CONCORD</span>
        </div>
        <button
          type="button"
          className="hamburger-btn"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </nav>

      <div className={`mobile-overlay${open ? " open" : ""}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar-drawer${open ? " open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark">MKS</div>
          <div>
            <p className="brand-name">MKS CONCORD</p>
            <p className="brand-subtitle">LLP · DOCUMENT CONTROL</p>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <button
          type="button"
          className={`sidebar-link ${active === "compare" ? "sidebar-link-active" : "sidebar-link-muted"}`}
          onClick={() => go("/")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Invoice comparison</span>
          {active === "compare" && <span className="sidebar-active-dot" />}
        </button>

        <button
          type="button"
          className={`sidebar-link ${active === "report" ? "sidebar-link-active" : "sidebar-link-muted"}`}
          onClick={() => go("/report")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" /><path d="M13 3v7h7M8 15h8M8 18h6" />
          </svg>
          <span>Verification report</span>
          {active === "report" && <span className="sidebar-active-dot" />}
        </button>

        <button
          type="button"
          className={`sidebar-link ${active === "reports" ? "sidebar-link-active" : "sidebar-link-muted"}`}
          onClick={() => go("/reports")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5M12 7v5l4 2" />
          </svg>
          <span>Saved reports</span>
          {active === "reports" && <span className="sidebar-active-dot" />}
        </button>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <div className="secure-note">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-slate-300">Document verification</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">Review extracted values before approval.</p>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
          <div className="sidebar-version">INVOICE CONTROL · V1.0</div>
        </div>
      </aside>
    </>
  );
}
