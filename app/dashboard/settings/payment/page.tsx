"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/components/dashboard/BottomNav";

type CardInfo = {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
};

export default function PaymentMethodPage() {
  const [card, setCard] = useState<CardInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/payment-method")
      .then((r) => r.json())
      .then((d) => {
        if (d.card) setCard(d.card);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const brandLabel = (brand: string) => {
    const map: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover" };
    return map[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
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
          Payment method
        </h1>

        {loading ? (
          <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
        ) : card ? (
          <div
            style={{
              border: "0.5px solid var(--border)",
              borderRadius: 12,
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 32,
                  borderRadius: 6,
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
                  {brandLabel(card.brand).toUpperCase().slice(0, 4)}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                  {brandLabel(card.brand)} ···· {card.last4}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  Expires {card.exp_month}/{String(card.exp_year).slice(-2)}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/add-payment"
              style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", background: "var(--bg-secondary)", border: "0.5px solid var(--border-md)", padding: "8px 14px", borderRadius: 8, textDecoration: "none" }}
            >
              Update
            </Link>
          </div>
        ) : (
          <div
            style={{
              border: "0.5px solid var(--border)",
              borderRadius: 12,
              padding: "28px 20px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
              No payment method on file.
            </p>
            <Link
              href="/dashboard/add-payment"
              style={{ fontSize: 14, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}
            >
              Add card
            </Link>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <Link
            href="/dashboard/settings/billing"
            style={{ fontSize: 14, color: "var(--text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
          >
            View billing history →
          </Link>
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
