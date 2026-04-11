"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  getOnboarding,
  clearOnboarding,
  getStartDate,
  formatStartDate,
  closingLine,
} from "@/lib/onboarding";

const FREQ_LABELS: Record<string, string> = {
  daily: "Every day",
  "4x_week": "4× per week",
  "3x_week": "3× per week",
};

export default function ConfirmPage() {
  const { status } = useSession();
  const router = useRouter();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<ReturnType<typeof getOnboarding>>({});

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    const s = getOnboarding();
    if (!s.title) { router.replace("/onboarding/goal"); return; }
    setState(s);
    // Auto-save once
    saveGoal(s);
  }, [status]);

  const saveGoal = async (s: ReturnType<typeof getOnboarding>) => {
    if (!s.title || saving || saved) return;
    setSaving(true);

    const res = await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: s.title,
        frequency: s.frequency,
        pledge_amount: s.pledgeAmount,
        tracking_app: s.trackingApp,
        start_date: getStartDate(s.frequency ?? "weekly").toISOString(),
      }),
    });

    if (res.ok) {
      setSaved(true);
      clearOnboarding();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to save your goal. Please try again.");
    }
    setSaving(false);
  };

  if (status === "loading") return null;

  const startDate = getStartDate(state.frequency ?? "weekly");
  const freqLabel =
    FREQ_LABELS[state.frequency ?? ""] ?? state.frequency ?? "—";

  const summaryRows = [
    { label: "Goal", value: state.title ?? "—" },
    {
      label: "Tracking via",
      value: state.trackingApp ?? "Manual logging",
    },
    {
      label: "Starts",
      value: formatStartDate(startDate),
    },
    {
      label: "Stakes",
      value: state.pledgeAmount ? `$${state.pledgeAmount}` : "—",
    },
  ];

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "52px 24px 56px",
        textAlign: "center",
      }}
    >
      {/* Checkmark */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#EAF3DE",
          border: "0.5px solid rgba(59,109,17,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 28px",
        }}
      >
        <span style={{ fontSize: 26, color: "#3B6D11" }}>✓</span>
      </div>

      <h1
        style={{
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
          marginBottom: 10,
          lineHeight: 1.15,
        }}
      >
        You&apos;re live.
      </h1>
      <p
        style={{
          fontSize: 16,
          color: "var(--text-secondary)",
          marginBottom: 36,
          lineHeight: 1.6,
        }}
      >
        Your first commitment is set.{" "}
        {closingLine(state.goalType ?? "other")}
      </p>

      {/* Summary card */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "0.5px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 28,
          textAlign: "left",
        }}
      >
        {summaryRows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderBottom:
                i < summaryRows.length - 1
                  ? "0.5px solid var(--border)"
                  : "none",
              gap: 12,
            }}
          >
            <span
              style={{ fontSize: 13, color: "var(--text-tertiary)", flexShrink: 0 }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--text-primary)",
                textAlign: "right",
              }}
            >
              {saving && row.label === "Goal" ? "Saving…" : row.value}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p
          style={{
            fontSize: 13,
            color: "#A32D2D",
            background: "#FDF2F2",
            padding: "10px 14px",
            borderRadius: 8,
            border: "0.5px solid rgba(163,45,45,0.2)",
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          {error}
        </p>
      )}

      <Link
        href="/dashboard"
        style={{
          display: "block",
          width: "100%",
          fontSize: 15,
          fontWeight: 500,
          background: "var(--text-primary)",
          color: "#fff",
          padding: "14px 0",
          borderRadius: 10,
          textDecoration: "none",
          marginBottom: 14,
          boxSizing: "border-box",
        }}
      >
        Go to my dashboard →
      </Link>

      <button
        onClick={() => {
          clearOnboarding();
          router.push("/onboarding/goal");
        }}
        style={{
          width: "100%",
          fontSize: 14,
          color: "var(--text-secondary)",
          background: "none",
          border: "0.5px solid var(--border-md)",
          padding: "12px 0",
          borderRadius: 10,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Add another commitment
      </button>
    </main>
  );
}
