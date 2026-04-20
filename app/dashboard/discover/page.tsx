"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/components/dashboard/BottomNav";

type PopularGoal = {
  id: string;
  title: string;
  category: string;
  tracking_method: string;
  active_users: number;
  hit_rate: number;
  avg_streak: number;
  friend_names: string[];
  friend_count: number;
};

function categoryColor(cat: string) {
  const map: Record<string, { bg: string; text: string }> = {
    Faith: { bg: "#F5F0FF", text: "#6B21A8" },
    Fitness: { bg: "#EAF3DE", text: "#3B6D11" },
    Focus: { bg: "#F0F4FF", text: "#1e40af" },
    Mindfulness: { bg: "#FFF8EC", text: "#854F0B" },
    Learning: { bg: "#F0FDF4", text: "#166534" },
    Health: { bg: "#FDF2F2", text: "#A32D2D" },
    Productivity: { bg: "#F8F9FA", text: "#374151" },
  };
  return map[cat] ?? { bg: "var(--bg-secondary)", text: "var(--text-secondary)" };
}

function trackingLabel(method: string) {
  if (method === "timer") return "Built-in timer";
  if (method === "connected") return "App sync";
  return "Manual";
}

function FriendAvatars({ names, count }: { names: string[]; count: number }) {
  if (names.length === 0) return null;
  const colors = ["#EAF3DE", "#FFF8EC", "#F0F4FF"];
  const textColors = ["#3B6D11", "#854F0B", "#1e40af"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex" }}>
        {names.slice(0, 3).map((name, i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: colors[i % 3],
              border: "1.5px solid var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: i > 0 ? -7 : 0,
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 700, color: textColors[i % 3] }}>{name.slice(0, 2).toUpperCase()}</span>
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
        {names[0]}{count > 1 ? ` and ${count - 1} friend${count > 2 ? "s" : ""} are doing this` : " is doing this"}
      </span>
    </div>
  );
}

export default function DiscoverPage() {
  const [goals, setGoals] = useState<PopularGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discover")
      .then((r) => r.json())
      .then((d) => {
        setGoals(d.goals ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 40px", borderBottom: "0.5px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", textDecoration: "none" }}>Sworn.</Link>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 4 }}>
            Top goals this month
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Most successful commitments across Sworn</p>
        </div>

        {loading ? (
          <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
        ) : goals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>No data yet — check back soon.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {goals.map((goal, i) => {
              const cat = categoryColor(goal.category);
              return (
                <div
                  key={goal.id}
                  style={{
                    border: "0.5px solid var(--border)",
                    borderRadius: 14,
                    padding: "18px 20px",
                    background: "var(--bg-secondary)",
                  }}
                >
                  {/* Rank + title */}
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: i < 3 ? "var(--text-primary)" : "var(--bg)", border: `0.5px solid ${i < 3 ? "transparent" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: i < 3 ? "#fff" : "var(--text-secondary)" }}>#{i + 1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 6 }}>
                        {goal.title}
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: cat.text, background: cat.bg, padding: "3px 8px", borderRadius: 20 }}>
                          {goal.category}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg)", border: "0.5px solid var(--border)", padding: "3px 8px", borderRadius: 20 }}>
                          {trackingLabel(goal.tracking_method)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Active users", value: goal.active_users },
                      { label: "Hit rate", value: `${goal.hit_rate}%` },
                      { label: "Avg streak", value: `${goal.avg_streak}d` },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: "center", background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "10px 6px" }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{s.value}</p>
                        <p style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Friends doing this */}
                  {goal.friend_count > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <FriendAvatars names={goal.friend_names} count={goal.friend_count} />
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/onboarding/goal?preset=${goal.id}`}
                    style={{ display: "block", textAlign: "center", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", background: "var(--bg)", border: "0.5px solid var(--border-md)", padding: "11px 0", borderRadius: 8, textDecoration: "none" }}
                  >
                    Start this goal →
                  </Link>
                </div>
              );
            })}
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
