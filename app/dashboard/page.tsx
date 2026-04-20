"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Goal, Datapoint } from "@/lib/supabase";
import NewGoalModal from "./NewGoalModal";
import BottomNav from "@/components/dashboard/BottomNav";

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch {
    return null;
  }
}

async function subscribeToPush(reg: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return null;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    return sub;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
  return bytes.buffer as ArrayBuffer;
}

function isGoalDueOnDay(frequency: string, date: Date): boolean {
  const day = date.getDay();
  if (frequency === "daily") return true;
  if (frequency === "4x_week") return day >= 1 && day <= 4;
  if (frequency === "3x_week") return day === 1 || day === 3 || day === 5;
  return true;
}

type DotStatus = "done" | "missed" | "today" | "partial" | "off";

function getWeekDots(goal: Goal): Array<{ status: DotStatus }> {
  const dots: Array<{ status: DotStatus }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    const due = isGoalDueOnDay(goal.frequency, d);

    if (!due) { dots.push({ status: "off" }); continue; }

    const dp = (goal.recent_datapoints ?? []).find(
      (p: Datapoint) => p.logged_at.split("T")[0] === dStr
    );

    if (dStr === todayStr) {
      if (dp) dots.push({ status: dp.met_target ? "done" : "partial" });
      else dots.push({ status: "today" });
    } else {
      if (dp) dots.push({ status: dp.met_target ? "done" : "partial" });
      else dots.push({ status: "missed" });
    }
  }
  return dots;
}

function getDotColor(status: string): string {
  if (status === "done") return "#3B6D11";
  if (status === "partial") return "#854F0B";
  if (status === "missed") return "#A32D2D";
  if (status === "today") return "rgba(0,0,0,0.15)";
  return "rgba(0,0,0,0.07)";
}

function getCardStatusDot(goal: Goal): string {
  const today = new Date().toISOString().split("T")[0];
  const dp = (goal.recent_datapoints ?? []).find(
    (p: Datapoint) => p.logged_at.split("T")[0] === today
  );
  if (dp) return dp.met_target ? "#3B6D11" : "#854F0B";
  if (goal.last_completed_date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (goal.last_completed_date < yesterday.toISOString().split("T")[0]) return "#A32D2D";
  }
  return "#854F0B";
}

function getTodayMeta(goal: Goal): string {
  const today = new Date().toISOString().split("T")[0];
  const dp = (goal.recent_datapoints ?? []).find(
    (p: Datapoint) => p.logged_at.split("T")[0] === today
  );
  if (dp) {
    if (dp.duration) {
      const mins = Math.round(dp.duration / 60);
      return `Done today · ${mins} min logged`;
    }
    return "Done today";
  }
  return "Not yet today";
}

function getSyncLabel(goal: Goal): string {
  if (goal.tracking_method === "connected" && goal.connected_app) {
    return `${goal.connected_app} · auto`;
  }
  if (goal.tracking_method === "timer") return "Built-in timer";
  return "Manual";
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetchGoals();
      checkPaymentMethod();
      checkNotificationPermission();
    }
  }, [status]);

  const fetchGoals = async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    if (res.ok) {
      const data = await res.json();
      setGoals(data.goals ?? []);
    }
    setLoading(false);
  };

  const checkPaymentMethod = async () => {
    const res = await fetch("/api/user/payment-status");
    if (res.ok) {
      const data = await res.json();
      setHasPaymentMethod(data.hasPaymentMethod);
    }
  };

  const checkNotificationPermission = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setNotifStatus("granted");
      ensurePushSubscription();
    } else if (Notification.permission === "denied") {
      setNotifStatus("denied");
    }
  };

  const ensurePushSubscription = async () => {
    const reg = await registerServiceWorker();
    if (!reg) return;
    const sub = await subscribeToPush(reg);
    if (sub) {
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    setNotifStatus("requesting");
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifStatus("granted");
      await ensurePushSubscription();
    } else {
      setNotifStatus("denied");
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 40px",
          borderBottom: "0.5px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 100,
        }}
      >
        <Link href="/" style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", textDecoration: "none" }}>
          Sworn.
        </Link>
        <button
          onClick={() => setShowModal(true)}
          style={{ fontSize: 13, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          + New goal
        </button>
      </header>

      {/* Banners */}
      {hasPaymentMethod === false && (
        <div style={{ background: "#FFF8EC", borderBottom: "0.5px solid rgba(181,130,40,0.25)", padding: "12px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <p style={{ fontSize: 13, color: "#854F0B" }}>
            Add a payment method before setting a goal — it&apos;s what makes the commitment real.
          </p>
          <Link href="/dashboard/add-payment" style={{ fontSize: 13, fontWeight: 500, color: "#854F0B", background: "rgba(181,130,40,0.12)", border: "0.5px solid rgba(181,130,40,0.3)", padding: "6px 14px", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            Add card →
          </Link>
        </div>
      )}
      {notifStatus === "idle" && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default" && (
        <div style={{ background: "#F0F4FF", borderBottom: "0.5px solid rgba(37,99,235,0.2)", padding: "12px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <p style={{ fontSize: 13, color: "#1e40af" }}>
            Turn on reminders — Sworn will nudge you when it&apos;s time to log your session.
          </p>
          <button onClick={requestNotificationPermission} style={{ fontSize: 13, fontWeight: 500, color: "#1e40af", background: "rgba(37,99,235,0.1)", border: "0.5px solid rgba(37,99,235,0.25)", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
            Enable reminders
          </button>
        </div>
      )}

      {/* Content */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 4 }}>
            Your goals
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {goals.length} active {goals.length === 1 ? "goal" : "goals"}
          </p>
        </div>

        {goals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 20px" }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 8 }}>No goals yet.</p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 28 }}>
              Set your first goal and put something on the line.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{ fontSize: 14, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "12px 28px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              Set your first goal
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goals.map((goal) => {
              const dots = getWeekDots(goal);
              const statusDotColor = getCardStatusDot(goal);
              const todayMeta = getTodayMeta(goal);
              const syncLabel = getSyncLabel(goal);

              return (
                <Link
                  key={goal.id}
                  href={`/dashboard/goals/${goal.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "var(--bg-secondary)",
                      border: "0.5px solid var(--border)",
                      borderRadius: 14,
                      padding: "18px 20px",
                      cursor: "pointer",
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-md)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3 }}>
                        {goal.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                          ${goal.pledge_amount}
                        </span>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusDotColor, flexShrink: 0 }} />
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>
                      {todayMeta}
                    </p>

                    {dots.length > 0 && (
                      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
                        {dots.map((d, i) => (
                          <div
                            key={i}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: getDotColor(d.status),
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: (goal.streak_count ?? 0) > 0 ? "#854F0B" : "var(--text-tertiary)" }}>
                        {(goal.streak_count ?? 0) > 0
                          ? `🔥 ${goal.streak_count} day streak`
                          : "No streak yet"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                        {syncLabel}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <NewGoalModal
          hasPaymentMethod={hasPaymentMethod === true}
          onClose={() => setShowModal(false)}
          onCreated={(goal) => { setGoals((prev) => [goal, ...prev]); setShowModal(false); }}
        />
      )}

      <BottomNav />

      <style>{`
        @media (max-width: 768px) {
          header { padding: 14px 20px !important; }
          main { padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  );
}
