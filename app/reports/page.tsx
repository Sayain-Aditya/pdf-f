"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type ReportSummary = {
  _id: string;
  supplier_pdf: { filename: string };
  customer_pdf: {
    filename: string;
    customer_invoice_no?: { value: string; page: number } | null;
  };
  summary: {
    match: number;
    mismatch: number;
    needs_review: number;
    missing_supplier: number;
    missing_customer: number;
    missing_both: number;
  };
  created_at: string;
};

function Icon({
  name,
  size = 20,
}: {
  name: "file" | "grid" | "shield" | "alert" | "check" | "arrow" | "refresh" | "compare" | "history";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<string, ReactNode> = {
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" /><path d="M13 3v7h7M8 15h8M8 18h6" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    alert: <><path d="M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>,
    compare: <><path d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8" /></>,
    history: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5M12 7v5l4 2" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function StatusPill({ count, tone, label }: { count: number; tone: string; label: string }) {
  return (
    <span className={`report-pill report-pill-${tone}`}>
      {count} {label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchReports() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/reports`, { credentials: "include" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = (await res.json()) as { reports: ReportSummary[] };
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  async function openReport(id: string) {
    try {
      const res = await fetch(`${API_URL}/reports/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      sessionStorage.setItem("invoiceReport", JSON.stringify(data));
      router.push("/report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report.");
    }
  }

  async function handleLogout() {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  return (
    <AuthGuard>
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">MKS</div>
          <div>
            <p className="brand-name">MKS CONCORD</p>
            <p className="brand-subtitle">LLP · DOCUMENT CONTROL</p>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <button type="button" className="sidebar-link sidebar-link-muted" onClick={() => router.push("/")}>
          <Icon name="grid" size={18} />
          <span>Invoice comparison</span>
        </button>
        <button type="button" className="sidebar-link sidebar-link-muted" onClick={() => router.push("/report")}>
          <Icon name="file" size={18} />
          <span>Verification report</span>
        </button>
        <div className="sidebar-link sidebar-link-active">
          <Icon name="history" size={18} />
          <span>Saved reports</span>
          <span className="sidebar-active-dot" />
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <div className="secure-note">
            <Icon name="shield" size={18} />
            <div>
              <p className="text-xs font-semibold text-slate-300">Document verification</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Review extracted values before approval.
              </p>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
          <div className="sidebar-version">INVOICE CONTROL · V1.0</div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              className="hover:text-slate-300 transition-colors"
              onClick={() => router.push("/")}
            >
              Workspace
            </button>
            <span>/</span>
            <span className="text-slate-300">Saved reports</span>
          </div>
          <div className="system-status">
            <span className="live-dot" />
            Local workspace
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                REPORT HISTORY
              </div>
              <h1>Saved reports</h1>
              <p className="page-description">
                All past invoice comparisons saved to the database.
              </p>
            </div>
            <div className="report-page-actions">
              <button type="button" className="secondary-button" onClick={fetchReports}>
                <Icon name="refresh" size={16} />
                Refresh
              </button>
              <button type="button" className="primary-button" onClick={() => router.push("/")}>
                <Icon name="compare" size={17} />
                New comparison
              </button>
            </div>
          </section>

          {error && (
            <div role="alert" className="error-banner" style={{ marginBottom: 20 }}>
              <Icon name="alert" size={19} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="loading-panel">
              <span className="spinner" />
              <p className="text-sm text-slate-400">Loading saved reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="reports-empty">
              <div className="reports-empty-icon">
                <Icon name="history" size={28} />
              </div>
              <p className="reports-empty-title">No reports yet</p>
              <p className="reports-empty-sub">
                Run an invoice comparison and it will appear here automatically.
              </p>
              <button
                type="button"
                className="primary-button"
                style={{ marginTop: 20 }}
                onClick={() => router.push("/")}
              >
                <Icon name="compare" size={17} />
                Start comparing
                <Icon name="arrow" size={16} />
              </button>
            </div>
          ) : (
            <div className="results-card">
              <div className="results-card-heading">
                <div>
                  <h3>Comparison history</h3>
                  <p>Click any row to view the full report.</p>
                </div>
                <span className="results-count">
                  {reports.length} report{reports.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="table-scroll">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Supplier file</th>
                      <th>Customer file</th>
                      <th>Customer invoice no.</th>
                      <th>Summary</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => {
                      const missing =
                        r.summary.missing_supplier +
                        r.summary.missing_customer +
                        r.summary.missing_both;
                      const invoiceNo =
                        r.customer_pdf.customer_invoice_no?.value ?? "—";
                      return (
                        <tr
                          key={r._id}
                          onClick={() => openReport(r._id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <span className="report-date">{formatDate(r.created_at)}</span>
                          </td>
                          <td>
                            <span className="report-filename">{r.supplier_pdf.filename}</span>
                          </td>
                          <td>
                            <span className="report-filename">{r.customer_pdf.filename}</span>
                          </td>
                          <td>
                            <span className="font-mono text-[12px] text-slate-300">{invoiceNo}</span>
                          </td>
                          <td>
                            <div className="report-pills">
                              {r.summary.match > 0 && (
                                <StatusPill count={r.summary.match} tone="green" label="matched" />
                              )}
                              {r.summary.mismatch > 0 && (
                                <StatusPill count={r.summary.mismatch} tone="red" label="mismatch" />
                              )}
                              {r.summary.needs_review > 0 && (
                                <StatusPill count={r.summary.needs_review} tone="amber" label="review" />
                              )}
                              {missing > 0 && (
                                <StatusPill count={missing} tone="slate" label="missing" />
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="report-open-btn">
                              <Icon name="arrow" size={15} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <footer className="dashboard-footer">
            <span>© MKS Concord LLP</span>
            <span>Invoice verification workspace</span>
          </footer>
        </div>
      </div>
    </main>
    </AuthGuard>
  );
}
