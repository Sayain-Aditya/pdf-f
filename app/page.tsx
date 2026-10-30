
"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "./components/AuthGuard";

type ComparisonResponse = {
  summary: Record<string, number>;
  results: unknown[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

async function getFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function validatePdf(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) return "Please select a PDF file.";
  if (file.size === 0) return "This file is empty. Please select another PDF.";
  if (file.size > MAX_FILE_SIZE_BYTES)
    return `File size must not exceed ${MAX_FILE_SIZE_MB} MB.`;

  return null;
}


function Icon({
  name,
  size = 20,
}: {
  name: "grid" | "file" | "compare" | "check" | "alert" | "download" | "upload" | "trash" | "arrow" | "shield" | "refresh";
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
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" /><path d="M13 3v7h7M8 15h8M8 18h6" /></>,
    compare: <><path d="M7 4 3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    alert: <><path d="M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function UploadPanel({
  title,
  subtitle,
  file,
  onChange,
  onRemove,
  error,
}: {
  title: string;
  subtitle: string;
  file: File | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(selected: File | undefined) {
    if (!selected) return;
    onChange(selected);
  }

  return (
    <div className="upload-panel">
      <div className="flex items-start gap-3">
        <div className="file-icon">
          <Icon name="file" size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</p>
        </div>
        <span className="required-tag">Required</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {file ? (
        <div className="selected-file">
          <div className="flex min-w-0 items-center gap-3">
            <div className="selected-file-icon">
              <Icon name="check" size={19} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">
                {file.name}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {formatBytes(file.size)} · PDF document
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            title="Remove file"
            aria-label={`Remove ${title}`}
            onClick={() => onChange(null)}
          >
            <Icon name="trash" size={17} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="drop-zone"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFile(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="upload-symbol">
            <Icon name="upload" size={22} />
          </span>
          <span className="mt-3 text-sm font-medium text-slate-200">
            Drop your PDF here or <span className="text-emerald-400">browse</span>
          </span>
          <span className="mt-1 text-xs text-slate-500">
            PDF files only
          </span>
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [supplierFile, setSupplierFile] = useState<File | null>(null);
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [supplierError, setSupplierError] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function handlePdfSelection(
    file: File | null,
    documentType: "supplier" | "customer"
  ) {
    const setFile = documentType === "supplier" ? setSupplierFile : setCustomerFile;
    const setFileError = documentType === "supplier" ? setSupplierError : setCustomerError;

    if (!file) {
      setFile(null);
      setFileError("");
      return;
    }

    const validationError = validatePdf(file);
    if (validationError) {
      setFile(null);
      setFileError(validationError);
      return;
    }

    setFile(file);
    setFileError("");
  }

  const canCompare =
    Boolean(supplierFile) &&
    Boolean(customerFile) &&
    !supplierError &&
    !customerError &&
    !loading;

  async function compareInvoices() {
    if (!supplierFile || !customerFile) {
      setError("Please select both PDF documents before comparing.");
      return;
    }

    const supplierHash = await getFileHash(supplierFile);
    const customerHash = await getFileHash(customerFile);

    if (supplierHash === customerHash) {
      setError(
        "Both uploaded documents are the same invoice. Please upload the supplier invoice and customer invoice separately."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("pdf1", supplierFile);
      formData.append("pdf2", customerFile);

      const response = await fetch(`${API_URL}/compare`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          `Comparison failed (${response.status}). ${details.slice(0, 300)}`
        );
      }

      const data = (await response.json()) as ComparisonResponse;

      if (!data.summary || !Array.isArray(data.results)) {
        throw new Error("The backend returned an unexpected comparison report.");
      }

      sessionStorage.setItem("invoiceReport", JSON.stringify(data));
      router.push("/report");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to compare invoices. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSupplierFile(null);
    setCustomerFile(null);
    setSupplierError("");
    setCustomerError("");
    setError("");
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
        <div className="sidebar-link sidebar-link-active">
          <Icon name="grid" size={18} />
          <span>Invoice comparison</span>
          <span className="sidebar-active-dot" />
        </div>
        <button type="button" className="sidebar-link sidebar-link-muted" onClick={() => router.push("/report")}>
          <Icon name="file" size={18} />
          <span>Verification report</span>
        </button>
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
            <span>Workspace</span>
            <span>/</span>
            <span className="text-slate-300">Invoice comparison</span>
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
                DOCUMENT VERIFICATION
              </div>
              <h1>Invoice comparison</h1>
              <p className="page-description">
                Validate machine identifiers and invoice references across
                supplier and customer documents.
              </p>
            </div>
            <div className="heading-tag">
              <Icon name="shield" size={16} />
              <span>Verification workspace</span>
            </div>
          </section>

          <section className="workspace-card">
            <div className="section-heading">
              <div>
                <div className="section-kicker">STEP 01</div>
                <h2>Upload documents</h2>
                <p>Select the two invoices you want to verify against each other.</p>
              </div>
              <span className="section-count">2 documents required</span>
            </div>

            <div className="upload-grid">
              <UploadPanel
                title="Supplier invoice"
                subtitle="Original invoice received from the machine supplier."
                file={supplierFile}
                onChange={(file) => handlePdfSelection(file, "supplier")}
                onRemove={() => handlePdfSelection(null, "supplier")}
                error={supplierError}
              />
              <UploadPanel
                title="Customer invoice"
                subtitle="Invoice issued by MKS Concord LLP to the customer."
                file={customerFile}
                onChange={(file) => handlePdfSelection(file, "customer")}
                onRemove={() => handlePdfSelection(null, "customer")}
                error={customerError}
              />
            </div>

            {error && (
              <div role="alert" className="error-banner">
                <Icon name="alert" size={19} />
                <span>{error}</span>
              </div>
            )}

            <div className="upload-actions">
              <button
                type="button"
                onClick={compareInvoices}
                disabled={!canCompare}
                className="primary-button disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Comparing documents...
                  </>
                ) : (
                  <>
                    <Icon name="compare" size={18} />
                    Compare invoices
                    <Icon name="arrow" size={17} />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="secondary-button"
              >
                <Icon name="refresh" size={16} />
                Reset
              </button>
              <p className="privacy-note">
                <Icon name="shield" size={14} />
                Documents are sent to your configured comparison API.
              </p>
            </div>
          </section>

          {loading && (
            <div className="loading-panel">
              <span className="spinner" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Processing your documents
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Extracting invoice fields and comparing values...
                </p>
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
