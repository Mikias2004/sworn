"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { Goal, Datapoint } from "@/lib/supabase";

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getTotalTime(dps: Datapoint[]): number {
  return dps.reduce((sum, d) => sum + (d.duration ?? 0), 0);
}

function getTodayStatus(dps: Datapoint[]): "done" | "partial" | "not_yet" {
  const today = new Date().toISOString().split("T")[0];
  const dp = dps.find((d) => d.logged_at.split("T")[0] === today);
  if (!dp) return "not_yet";
  return dp.met_target ? "done" : "partial";
}

const STATUS_PILL: Record<string, { label: string; bg: string; color: string }> = {
  done: { label: "Done", bg: "#EAF3DE", color: "#3B6D11" },
  partial: { label: "Partial", bg: "#FFF8EC", color: "#854F0B" },
  not_yet: { label: "Not yet", bg: "var(--bg)", color: "var(--text-secondary)" },
};

export default function GoalDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingValue, setLoggingValue] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") fetchGoal();
  }, [status]);

  const fetchGoal = async () => {
    setLoading(true);
    const res = await fetch(`/api/goals/${id}`);
    if (res.ok) {
      const data = await res.json();
      setGoal(data.goal);
    } else {
      router.replace("/dashboard");
    }
    setLoading(false);
  };

  const handleManualLog = async () => {
    if (!loggingValue || !goal) return;
    setLogSubmitting(true);
    const res = await fetch(`/api/goals/${id}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration_seconds: null, met_target: true, value: parseFloat(loggingValue) }),
    });
    if (res.ok) {
      setJustLogged(true);
      setShowManualInput(false);
      setLoggingValue("");
      await fetchGoal();
    }
    setLogSubmitting(false);
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
      </div>
    );
  }

  if (!goal) return null;

  const dps: Datapoint[] = goal.recent_datapoints ?? [];
  const todayStatus = getTodayStatus(dps);
  const pill = STATUS_PILL[todayStatus];
  const totalTimeSec = getTotalTime(dps);
  const totalTimeMins = Math.round(totalTimeSec / 60);
  const isTimer = goal.tracking_method === "timer" || (!goal.tracking_method && !goal.connected_app);
  const isConnected = goal.tracking_method === "connected";
  const trackingDisplay = isConnected
    ? goal.connected_app ?? goal.tracking_app ?? "Connected app"
    : isTimer
    ? "Built-in timer"
    : "Manual";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", padding: "14px 24px", borderBottom: "0.5px solid var(--border)", gap: 12, position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-secondary)", padding: "4px 8px 4px 0", fontFamily: "inherit", lineHeight: 1 }}
        >
          ←
        </button>
        <Link href="/" style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", textDecoration: "none" }}>
          Sworn.
        </Link>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "36px 24px 60px" }}>
        {/* Title */}
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.3 }}>
          {goal.title}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 28 }}>
          {goal.frequency === "daily" ? "Daily" : goal.frequency?.replace("_", "× ")} · {trackingDisplay} · ${goal.pledge_amount} on the line
        </p>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Current streak", value: `${goal.streak_count ?? 0} days` },
            { label: "Total sessions", value: String(dps.length) },
            { label: "Stake amount", value: `$${goal.pledge_amount}` },
            {
              label: isTimer ? "Total time" : "Total logged",
              value: isTimer ? `${totalTimeMins} min` : `${dps.length} sessions`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--border)",
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {stat.label}
              </p>
              <p style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Today card */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "0.5px solid var(--border)",
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Today</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                background: pill.bg,
                color: pill.color,
                border: `0.5px solid ${pill.color}22`,
                borderRadius: 99,
                padding: "3px 10px",
              }}
            >
              {pill.label}
            </span>
          </div>

          {/* Timer goals */}
          {isTimer && todayStatus !== "done" && (
            <Link
              href={`/dashboard/goals/${id}/timer`}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                fontSize: 15,
                fontWeight: 500,
                background: "var(--text-primary)",
                color: "#fff",
                padding: "13px 0",
                borderRadius: 9,
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              Start session →
            </Link>
          )}

          {isTimer && todayStatus === "done" && (
            <p style={{ fontSize: 13, color: "#3B6D11" }}>Session logged for today ✓</p>
          )}

          {/* Connected app goals */}
          {isConnected && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                {goal.connected_app ?? goal.tracking_app} is tracking automatically
              </p>
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                style={{ fontSize: 12, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
              >
                Log a session manually
              </button>
            </div>
          )}

          {/* Manual goals */}
          {!isTimer && !isConnected && !showManualInput && todayStatus !== "done" && (
            <button
              onClick={() => setShowManualInput(true)}
              style={{
                width: "100%",
                fontSize: 15,
                fontWeight: 500,
                background: "var(--text-primary)",
                color: "#fff",
                padding: "13px 0",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Log today →
            </button>
          )}

          {/* Manual input */}
          {showManualInput && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input
                type="number"
                placeholder="How many did you complete?"
                value={loggingValue}
                onChange={(e) => setLoggingValue(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg)",
                  border: "0.5px solid var(--border-md)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleManualLog}
                disabled={!loggingValue || logSubmitting}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  background: "var(--text-primary)",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: loggingValue && !logSubmitting ? "pointer" : "default",
                  fontFamily: "inherit",
                  opacity: loggingValue && !logSubmitting ? 1 : 0.5,
                }}
              >
                {logSubmitting ? "…" : "Save"}
              </button>
            </div>
          )}

          {justLogged && (
            <p style={{ fontSize: 13, color: "#3B6D11", marginTop: 10 }}>Logged ✓</p>
          )}
        </div>

        {/* Session history */}
        {dps.length > 0 && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Session history
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "0.5px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              {dps.map((dp, i) => (
                <div
                  key={dp.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "var(--bg-secondary)",
                    borderBottom: i < dps.length - 1 ? "0.5px solid var(--border)" : "none",
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {fmtDate(dp.logged_at)}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {dp.duration ? (
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                        {Math.round(dp.duration / 60)} min
                      </span>
                    ) : dp.value ? (
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                        {dp.value} logged
                      </span>
                    ) : null}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: dp.met_target ? "#3B6D11" : "#A32D2D",
                        flexShrink: 0,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
