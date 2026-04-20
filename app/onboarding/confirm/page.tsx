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
import { getAppByName } from "@/lib/apps";


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
    saveGoal(s);
  }, [status]);

  const saveGoal = async (s: ReturnType<typeof getOnboarding>) => {
    if (!s.title || saving || saved) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: s.title,
          frequency: s.frequency,
          pledge_amount: s.pledgeAmount,
          tracking_app: s.trackingApp,
          tracking_method: s.recommendedTrackingMethod ?? (s.trackingApp ? "connected" : "manual"),
          connected_app: s.trackingApp ?? null,
          started_via_goal_id: s.startedViaGoalId ?? null,
          started_via_type: s.startedViaType ?? null,
        }),
      });

      if (res.ok) {
        setSaved(true);
        clearOnboarding();
      } else {
        const d = await res.json().catch(() => ({}));
        const msg = d.error ?? "Failed to save your goal. Please try again.";
        console.error("Goal save failed:", msg);
        setError(msg);
      }
    } catch (err) {
      console.error("Goal save error:", err);
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  if (status === "loading") return null;

  const connectedApp = state.trackingApp ? getAppByName(state.trackingApp) : null;
  const startDate = getStartDate(state.frequency ?? "weekly");
  const summaryRows = [
    { label: "Goal", value: state.title ?? "—" },
    {
      label: "Tracking via",
      value: state.trackingApp ?? "Built-in timer",
      isApp: !!state.trackingApp,
    },
    { label: "Starts", value: formatStartDate(startDate) },
    { label: "Stakes", value: state.pledgeAmount ? `$${state.pledgeAmount}` : "—" },
  ];

  const hasApp = !!state.trackingApp;

  // Loading state — save in progress
  if (saving && !saved) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "52px 24px 56px", textAlign: "center" }}>
        <div style={{ color: "var(--text-tertiary)", fontSize: 15 }}>Saving your commitment…</div>
      </main>
    );
  }

  // Error state — save failed, let user retry
  if (error && !saved) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "52px 24px 56px", textAlign: "center" }}>
        <p
          style={{
            fontSize: 14,
            color: "#A32D2D",
            background: "#FDF2F2",
            padding: "14px 16px",
            borderRadius: 10,
            border: "0.5px solid rgba(163,45,45,0.2)",
            marginBottom: 20,
            textAlign: "left",
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
        <button
          onClick={() => saveGoal(state)}
          style={{
            width: "100%",
            fontSize: 15,
            fontWeight: 500,
            background: "var(--text-primary)",
            color: "#fff",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 14,
          }}
        >
          Try again
        </button>
        <button
          onClick={() => router.back()}
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
          Go back
        </button>
      </main>
    );
  }

  // Success state
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "52px 24px 56px", textAlign: "center" }}>
      {/* Checkmark */}
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          background: "#EAF3DE",
          border: "0.5px solid rgba(59,109,17,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 28px",
        }}
      >
        <span style={{ fontSize: 28, color: "#3B6D11" }}>✓</span>
      </div>

      <h1
        style={{
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
          marginBottom: 10,
          lineHeight: 1.15,
        }}
      >
        {hasApp ? `${state.trackingApp} connected.` : "You're live."}
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 36, lineHeight: 1.6 }}>
        {hasApp
          ? `Every ${connectedApp?.activity ?? "activity"} you log in ${state.trackingApp} counts toward your goal automatically. No manual logging ever.`
          : `Your first commitment is set. ${closingLine(state.goalType ?? "other")}`}
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
              borderBottom: i < summaryRows.length - 1 ? "0.5px solid var(--border)" : "none",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-tertiary)", flexShrink: 0 }}>
              {row.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {row.isApp && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#3B6D11",
                    background: "#EAF3DE",
                    border: "0.5px solid rgba(59,109,17,0.25)",
                    borderRadius: 99,
                    padding: "2px 8px",
                  }}
                >
                  Active
                </span>
              )}
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", textAlign: "right" }}>
                {row.value}
              </span>
            </div>
          </div>
        ))}
      </div>

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
        onClick={() => { clearOnboarding(); router.push("/onboarding/goal"); }}
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
