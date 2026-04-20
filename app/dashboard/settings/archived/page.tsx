"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/components/dashboard/BottomNav";

type ArchivedGoal = {
  id: string;
  title: string;
  archived_at: string;
  created_at: string;
  total_completed: number;
  total_missed: number;
  total_charged: number;
};

function daysAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function lifespan(created: string, archived: string) {
  const diff = new Date(archived).getTime() - new Date(created).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

export default function ArchivedGoalsPage() {
  const [goals, setGoals] = useState<ArchivedGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/goals/archived")
      .then((r) => r.json())
      .then((d) => {
        setGoals(d.goals ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRestore = async (id: string) => {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/goals/${id}/delete`, { method: "DELETE" });
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setConfirming(null);
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

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 32 }}>
          Archived goals
        </h1>

        {loading ? (
          <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
        ) : goals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 6 }}>No archived goals.</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Goals you archive will appear here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  border: "0.5px solid var(--border)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  background: "var(--bg-secondary)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3, marginRight: 12 }}>
                    {goal.title}
                  </p>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>
                  Archived {daysAgo(goal.archived_at)} · Lasted {lifespan(goal.created_at, goal.archived_at)}
                </p>

                {/* Stats */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "#3B6D11" }}>{goal.total_completed}</p>
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>completed</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "#A32D2D" }}>{goal.total_missed}</p>
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>missed</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>${(goal.total_charged / 100).toFixed(0)}</p>
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>charged</p>
                  </div>
                </div>

                {/* Actions */}
                {confirming === goal.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#fff", background: "#A32D2D", border: "none", padding: "10px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Delete permanently
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)", background: "var(--bg)", border: "0.5px solid var(--border-md)", padding: "10px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleRestore(goal.id)}
                      style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text-primary)", background: "var(--bg)", border: "0.5px solid var(--border-md)", padding: "10px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => setConfirming(goal.id)}
                      style={{ flex: 1, fontSize: 13, color: "#A32D2D", background: "rgba(163,45,45,0.06)", border: "0.5px solid rgba(163,45,45,0.2)", padding: "10px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Delete
                    </button>
                  </div>
                )}
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
