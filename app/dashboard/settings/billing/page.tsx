"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/components/dashboard/BottomNav";

type ChargeRow = {
  id: string;
  charged_at: string;
  reason: string;
  goal_title: string | null;
  amount: number;
  status: "charged" | "refunded";
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatReason(reason: string) {
  if (reason === "missed_daily") return "Missed daily goal";
  if (reason === "missed_weekly") return "Missed weekly goal";
  return reason;
}

export default function BillingHistoryPage() {
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/billing")
      .then((r) => r.json())
      .then((d) => {
        setCharges(d.charges ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 32 }}>
          Billing history
        </h1>

        {loading ? (
          <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
        ) : charges.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 6 }}>No charges yet.</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>You&apos;ll see charges here if you miss a goal.</p>
          </div>
        ) : (
          <div style={{ border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {charges.map((charge, i) => (
              <div
                key={charge.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  padding: "16px 18px",
                  borderTop: i > 0 ? "0.5px solid var(--border)" : "none",
                  background: "var(--bg)",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                    {formatReason(charge.reason)}
                  </p>
                  {charge.goal_title && (
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>{charge.goal_title}</p>
                  )}
                  <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{formatDate(charge.charged_at)}</p>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                    ${(charge.amount / 100).toFixed(2)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: charge.status === "refunded" ? "#2D7A4A" : "#A32D2D",
                      background: charge.status === "refunded" ? "#F2FDF5" : "#FDF2F2",
                      border: `0.5px solid ${charge.status === "refunded" ? "rgba(45,122,74,0.2)" : "rgba(163,45,45,0.2)"}`,
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    {charge.status === "refunded" ? "Refunded" : "Charged"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
