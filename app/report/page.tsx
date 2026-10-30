"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "../components/AuthGuard";

type ExtractedField = { value: string; page: number };

type ComparisonResult = {
  field: string;
  supplier: ExtractedField | null;
  customer: ExtractedField | null;
  status:
    | "match"
    | "mismatch"
    | "needs_review"
    | "missing_supplier"
    | "missing_customer"
    | "missing_both";
  reason: string | null;
};

type ComparisonResponse = {
  supplier_pdf: {
    filename: string;
    page_count: number;
    ocr_used: boolean;
    fields: Record<string, ExtractedField | null>;
  };
  customer_pdf: {
    filename: string;
    page_count: number;
    ocr_used: boolean;
    fields: Record<string, ExtractedField | null>;
    customer_invoice_no?: ExtractedField | null;
  };
  summary: {
    match: number;
    mismatch: number;
    needs_review: number;
    missing_supplier: number;
    missing_customer: number;
    missing_both: number;
  };
  results: ComparisonResult[];
};

const fieldLabels: Record<string, string> = {
  supplier_invoice_reference: "Supplier invoice reference",
  buyer_order_no: "Buyer's order number",
  chassis_no: "Chassis number",
  engine_no: "Engine number",
  eml_no: "EML number",
  serial_no: "Manufacturing serial number",
  machine_model: "Machine model",
};

const statusLabels: Record<string, string> = {
  match: "Matched",
  mismatch: "Mismatch",
  needs_review: "Needs review",
  missing_supplier: "Missing in supplier",
  missing_customer: "Missing in customer",
  missing_both: "Missing in both",
};

function Icon({
  name,
  size = 20,
}: {
  name: "file" | "check" | "alert" | "download" | "arrow" | "shield" | "grid" | "compare" | "refresh" | "trash" | "upload";
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
    check: <><path d="m5 12 4 4L19 6" /></>,
    alert: <><path d="M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    compare: <><path d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "match"
      ? "status-match"
      : status === "mismatch"
        ? "status-mismatch"
        : status === "needs_review"
          ? "status-review"
          : "status-missing";

  return (
    <span className={`status-badge ${style}`}>
      <span className="status-dot" />
      {statusLabels[status] ?? status}
    </span>
  );
}

function FieldValue({ field }: { field: ExtractedField | null | undefined }) {
  if (!field) {
    return <span className="text-slate-500 italic">Not found</span>;
  }
  return (
    <div className="min-w-0">
      <span className="break-words font-mono text-[13px] text-slate-200">
        {field.value}
      </span>
      <span className="mt-1 block text-[11px] text-slate-500">
        Page {field.page}
      </span>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<ComparisonResponse | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("invoiceReport");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setReport(JSON.parse(raw) as ComparisonResponse);
    } catch {
      router.replace("/");
    }
  }, [router]);

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mks-invoice-comparison-report.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function newComparison() {
    sessionStorage.removeItem("invoiceReport");
    router.push("/");
  }

  async function handleLogout() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  if (!report) {
    return (
      <main className="app-shell">
        <div className="main-column">
          <div className="dashboard-content" style={{ paddingTop: 60 }}>
            <div className="loading-panel">
              <span className="spinner" />
              <p className="text-sm text-slate-400">Loading report...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const customerInvoiceNo =
    report.customer_pdf.customer_invoice_no?.value ??
    report.customer_pdf.fields.customer_invoice_no?.value ??
    "Not detected";

  const summaryCards = [
    { label: "Fields matched", value: report.summary.match, icon: "check" as const, tone: "green" },
    { label: "Mismatches", value: report.summary.mismatch, icon: "alert" as const, tone: "red" },
    { label: "Needs review", value: report.summary.needs_review, icon: "shield" as const, tone: "amber" },
    {
      label: "Missing values",
      value: report.summary.missing_supplier + report.summary.missing_customer + report.summary.missing_both,
      icon: "file" as const,
      tone: "slate",
    },
  ];

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
        <button
          type="button"
          className="sidebar-link sidebar-link-muted"
          onClick={newComparison}
        >
          <Icon name="grid" size={18} />
          <span>Invoice comparison</span>
        </button>
        <div className="sidebar-link sidebar-link-active">
          <Icon name="file" size={18} />
          <span>Verification report</span>
          <span className="sidebar-active-dot" />
        </div>
        <button type="button" className="sidebar-link sidebar-link-muted" onClick={() => router.push("/reports")}>
          <Icon name="refresh" size={18} />
          <span>Saved reports</span>
        </button>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <div className="secure-note">
            <Icon name="shield" size={18} />
            <div>
              <p className="text-xs font-semibold text-slate-300">
                Document verification
              </p>
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
              onClick={newComparison}
            >
              Workspace
            </button>
            <span>/</span>
            <span className="text-slate-300">Verification report</span>
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
                VERIFICATION RESULTS
              </div>
              <h1>Comparison report</h1>
              <p className="page-description">
                Review the extracted values before making business decisions.
              </p>
            </div>
            <div className="report-page-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={downloadReport}
              >
                <Icon name="download" size={17} />
                Export JSON
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={newComparison}
              >
                <Icon name="compare" size={17} />
                New comparison
              </button>
            </div>
          </section>

          <div className="metrics-grid">
            {summaryCards.map((card) => (
              <div className="metric-card" key={card.label}>
                <div className="metric-topline">
                  <span>{card.label}</span>
                  <span className={`metric-icon metric-${card.tone}`}>
                    <Icon name={card.icon} size={17} />
                  </span>
                </div>
                <div className="metric-value">{card.value}</div>
                <div className="metric-footnote">Comparison fields</div>
              </div>
            ))}
          </div>

          <div className="document-grid">
            <div className="document-card">
              <div className="document-card-heading">
                <span className="document-mini-icon">
                  <Icon name="file" size={17} />
                </span>
                <span>SUPPLIER DOCUMENT</span>
                <span className="document-pages">
                  {report.supplier_pdf.page_count} page(s)
                </span>
              </div>
              <p className="document-filename">{report.supplier_pdf.filename}</p>
              <p className="document-meta">
                OCR used: {report.supplier_pdf.ocr_used ? "Yes" : "No"}
              </p>
            </div>

            <div className="document-card">
              <div className="document-card-heading">
                <span className="document-mini-icon">
                  <Icon name="file" size={17} />
                </span>
                <span>CUSTOMER DOCUMENT</span>
                <span className="document-pages">
                  {report.customer_pdf.page_count} page(s)
                </span>
              </div>
              <p className="document-filename">{report.customer_pdf.filename}</p>
              <p className="document-meta">
                Invoice number:{" "}
                <span className="text-slate-300">{customerInvoiceNo}</span>
              </p>
            </div>
          </div>

          <div className="results-card">
            <div className="results-card-heading">
              <div>
                <h3>Field-by-field comparison</h3>
                <p>Values extracted from both uploaded documents.</p>
              </div>
              <span className="results-count">
                {report.results.length} fields
              </span>
            </div>

            <div className="table-scroll">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Supplier value</th>
                    <th>Customer value</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((result) => (
                    <tr key={result.field}>
                      <td>
                        <span className="field-name">
                          {fieldLabels[result.field] ?? result.field}
                        </span>
                      </td>
                      <td><FieldValue field={result.supplier} /></td>
                      <td><FieldValue field={result.customer} /></td>
                      <td>
                        <StatusBadge status={result.status} />
                        {result.reason && (
                          <p className="status-reason">{result.reason}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="results-footer">
              <Icon name="shield" size={15} />
              Automated extraction can make mistakes. Review flagged values
              and important identifiers against the original documents.
            </div>
          </div>

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
