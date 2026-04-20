"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import BottomNav from "@/components/dashboard/BottomNav";

export default function PrivacyPage() {
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteInput, setDeleteInput] = useState("");

  const handleExport = async () => {
    setExporting(true);
    const res = await fetch("/api/user/export");
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sworn-data.json";
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleteStep("deleting");
    await fetch("/api/user/delete", { method: "DELETE" });
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 40px",
          borderBottom: "0.5px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 100,
        }}
      >
        <Link href="/dashboard/settings" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
          ← Settings
        </Link>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 32 }}>
          Privacy & data
        </h1>

        {/* Export */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
            Your data
          </p>
          <div style={{ border: "0.5px solid var(--border)", borderRadius: 12, padding: "20px" }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>Export my data</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
              Download a JSON file with all your goals, datapoints, and account information.
            </p>
            {exportDone ? (
              <p style={{ fontSize: 13, color: "#2D7A4A" }}>Download started.</p>
            ) : (
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", background: "var(--bg-secondary)", border: "0.5px solid var(--border-md)", padding: "10px 20px", borderRadius: 8, cursor: exporting ? "default" : "pointer", fontFamily: "inherit", opacity: exporting ? 0.6 : 1 }}
              >
                {exporting ? "Preparing…" : "Download my data"}
              </button>
            )}
          </div>
        </div>

        {/* Connected apps */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
            Connected apps
          </p>
          <div style={{ border: "0.5px solid var(--border)", borderRadius: 12, padding: "20px" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Connected apps are managed per goal. To disconnect an app, archive or edit the associated goal.
            </p>
          </div>
        </div>

        {/* Delete account */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#A32D2D", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
            Danger zone
          </p>
          <div style={{ border: "0.5px solid rgba(163,45,45,0.3)", borderRadius: 12, padding: "20px" }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#A32D2D", marginBottom: 6 }}>Delete account</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
              Permanently delete your account and all data. This cannot be undone.
            </p>

            {deleteStep === "idle" && (
              <button
                onClick={() => setDeleteStep("confirm")}
                style={{ fontSize: 13, fontWeight: 500, color: "#A32D2D", background: "rgba(163,45,45,0.08)", border: "0.5px solid rgba(163,45,45,0.25)", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}
              >
                Delete my account
              </button>
            )}

            {deleteStep === "confirm" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 13, color: "#A32D2D" }}>Type DELETE to confirm:</p>
                <input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  style={{ fontSize: 14, color: "var(--text-primary)", background: "var(--bg)", border: "0.5px solid rgba(163,45,45,0.4)", borderRadius: 8, padding: "10px 14px", fontFamily: "inherit", outline: "none" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "DELETE"}
                    style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#fff", background: "#A32D2D", border: "none", padding: "11px 0", borderRadius: 8, cursor: deleteInput !== "DELETE" ? "default" : "pointer", fontFamily: "inherit", opacity: deleteInput !== "DELETE" ? 0.4 : 1 }}
                  >
                    Delete permanently
                  </button>
                  <button
                    onClick={() => { setDeleteStep("idle"); setDeleteInput(""); }}
                    style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-secondary)", border: "0.5px solid var(--border)", padding: "11px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStep === "deleting" && (
              <p style={{ fontSize: 13, color: "#A32D2D" }}>Deleting account…</p>
            )}
          </div>
        </div>
      </main>

      <BottomNav />

      <style>{`
        @media (max-width: 768px) {
          header { padding: 14px 20px !important; }
        }
      `}</style>
    </div>
  );
}
