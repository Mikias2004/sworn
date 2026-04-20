"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Goal } from "@/lib/supabase";
import { getAppByName, getAppIconUrl } from "@/lib/apps";
import BottomNav from "@/components/dashboard/BottomNav";

// ---- Push notification helpers ----

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
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
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
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

// ---- Card helper functions ----

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function getCurrentWeekDates(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun, 1=Mon
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isGoalDueOnDay(frequency: string, date: Date): boolean {
  const day = date.getDay();
  if (frequency === "daily") return true;
  if (frequency === "4x_week") return day >= 1 && day <= 4;
  if (frequency === "3x_week") return day === 1 || day === 3 || day === 5;
  return true;
}

function getWeeklyTotal(goal: Goal): number {
  if (goal.period_target) return goal.period_target;
  if (goal.frequency === "daily") return 7;
  if (goal.frequency === "4x_week") return 4;
  if (goal.frequency === "3x_week") return 3;
  return 1;
}

function getWeekProgress(goal: Goal): { completed: number; total: number; pct: number } {
  const weekDates = getCurrentWeekDates();
  const weekStart = weekDates[0].toISOString().split("T")[0];
  const weekEnd = weekDates[6].toISOString().split("T")[0];
  const total = getWeeklyTotal(goal);
  const completed = (goal.recent_datapoints ?? []).filter((dp) => {
    const d = dp.logged_at.split("T")[0];
    return d >= weekStart && d <= weekEnd && dp.met_target;
  }).length;
  return { completed, total, pct: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0 };
}

function getTodayProgress(goal: Goal): { minutes: number; target: number; pct: number; done: boolean } {
  const todayStr = new Date().toISOString().split("T")[0];
  const dp = (goal.recent_datapoints ?? []).find((p) => p.logged_at.split("T")[0] === todayStr);
  const targetMins = goal.target_duration_seconds ? Math.round(goal.target_duration_seconds / 60) : 0;
  if (!dp) return { minutes: 0, target: targetMins, pct: 0, done: false };
  const mins = dp.duration ? Math.round(dp.duration / 60) : 0;
  const pct = targetMins > 0
    ? Math.min(100, Math.round((mins / targetMins) * 100))
    : dp.met_target ? 100 : 0;
  return { minutes: mins, target: targetMins, pct, done: dp.met_target };
}

type DayStatus = "done" | "missed" | "today" | "future" | "off";

function getWeeklyDotStatus(goal: Goal): DayStatus[] {
  const weekDates = getCurrentWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  return weekDates.map((day) => {
    const dStr = day.toISOString().split("T")[0];
    if (day > today) return "future";
    const due = isGoalDueOnDay(goal.frequency, day);
    if (!due) return "off";
    const dp = (goal.recent_datapoints ?? []).find((p) => p.logged_at.split("T")[0] === dStr);
    if (dStr === todayStr) return dp?.met_target ? "done" : "today";
    return dp?.met_target ? "done" : "missed";
  });
}

function isAtRisk(goal: Goal): boolean {
  const todayStr = new Date().toISOString().split("T")[0];
  const dp = (goal.recent_datapoints ?? []).find((p) => p.logged_at.split("T")[0] === todayStr);
  if (dp) return false;
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  return (midnight.getTime() - now.getTime()) / 3_600_000 < 4;
}

function getStatusColor(goal: Goal): string {
  const todayStr = new Date().toISOString().split("T")[0];
  const dp = (goal.recent_datapoints ?? []).find((p) => p.logged_at.split("T")[0] === todayStr);
  if (dp?.met_target) return "#3B6D11";
  if (dp && !dp.met_target) return "#BA7517";
  if (isAtRisk(goal)) return "#A32D2D";
  // Check if daily goal was missed yesterday
  if (goal.frequency === "daily" && goal.last_completed_date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (goal.last_completed_date < yesterday.toISOString().split("T")[0]) return "#A32D2D";
  }
  return "#BA7517";
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return "yesterday";
  return `${Math.floor(hrs / 24)}d ago`;
}

function getDayBarColor(status: DayStatus): string {
  if (status === "done") return "#3B6D11";
  if (status === "missed") return "#A32D2D";
  if (status === "today") return "rgba(0,0,0,0.22)";
  return "rgba(0,0,0,0.08)";
}

// ---- Goal Card Component ----

function GoalCard({ goal }: { goal: Goal }) {
  const isDaily = goal.frequency === "daily";
  const statusColor = getStatusColor(goal);
  const atRisk = isAtRisk(goal);
  const dots = getWeeklyDotStatus(goal);

  // Progress data
  const todayProg = getTodayProgress(goal);
  const weekProg = getWeekProgress(goal);

  // Progress bar values
  let progressLabel = "";
  let progressValue = "";
  let progressPct = 0;
  let progressColor = statusColor;

  if (isDaily) {
    progressLabel = "Today's session";
    if (goal.target_duration_seconds && goal.target_duration_seconds > 0) {
      const targetMins = Math.round(goal.target_duration_seconds / 60);
      progressValue = todayProg.done
        ? `${todayProg.minutes} / ${targetMins} min ✓`
        : `${todayProg.minutes} / ${targetMins} min`;
      progressPct = todayProg.pct;
    } else {
      progressValue = todayProg.done ? "Done ✓" : "Not logged yet";
      progressPct = todayProg.done ? 100 : 0;
    }
  } else {
    progressLabel = "Weekly progress";
    progressValue = `${weekProg.completed} / ${weekProg.total} sessions`;
    progressPct = weekProg.pct;
  }

  if (progressPct >= 100) progressColor = "#3B6D11";
  else if (progressPct > 0) progressColor = "#BA7517";
  else if (atRisk) progressColor = "#A32D2D";
  else progressColor = "rgba(0,0,0,0.12)";

  // Meta line
  let metaLine = "";
  if (isDaily) {
    if (todayProg.done) {
      metaLine = goal.target_duration_seconds
        ? `Today · ${todayProg.minutes} min logged ✓`
        : "Today · Done ✓";
    } else {
      metaLine = "Today · Not logged yet";
    }
  } else {
    const unit = goal.target_unit ?? "sessions";
    metaLine = `This week · ${weekProg.completed} of ${weekProg.total} ${unit} logged`;
  }

  // Sync label
  const connectedAppInfo =
    goal.tracking_method === "connected" && goal.connected_app
      ? getAppByName(goal.connected_app)
      : null;
  let syncText = "Manual";
  if (goal.tracking_method === "timer") syncText = "Built-in timer";
  else if (goal.connected_app) {
    const synced = relativeTime(goal.last_synced_at);
    syncText = synced ? `${goal.connected_app} · ${synced}` : `${goal.connected_app} · auto`;
  }

  return (
    <div
      style={{
        background: "var(--bg)",
        border: "0.5px solid var(--border)",
        borderRadius: 12,
        padding: 14,
        cursor: "pointer",
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-md)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      {/* 1. Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              marginBottom: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {goal.title}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.4 }}>
            {metaLine}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
            ${goal.pledge_amount}
          </span>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: statusColor,
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* 2. Progress section */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 5,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            {progressLabel}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            {progressValue}
          </span>
        </div>
        <div
          style={{
            height: 4,
            background: "rgba(0,0,0,0.07)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: progressColor,
              borderRadius: 99,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* 3. Weekly dot tracker */}
      <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
        {dots.map((status, i) => (
          <div
            key={i}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
          >
            <span
              style={{
                fontSize: 9,
                color: status === "today" ? "var(--text-primary)" : "var(--text-tertiary)",
                fontWeight: status === "today" ? 600 : 400,
                lineHeight: 1,
              }}
            >
              {DAY_LETTERS[i]}
            </span>
            <div
              style={{
                width: "100%",
                height: 4,
                borderRadius: 99,
                background: getDayBarColor(status),
              }}
            />
          </div>
        ))}
      </div>

      {/* 4. Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          paddingTop: 10,
          borderTop: "0.5px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          {(goal.streak_count ?? 0) > 0 ? (
            <>
              🔥{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {goal.streak_count} day streak
              </span>
              {atRisk && (
                <span style={{ color: "#A32D2D" }}> · at risk</span>
              )}
            </>
          ) : (
            <>🔥 <span style={{ color: "var(--text-tertiary)" }}>New commitment</span></>
          )}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
          {connectedAppInfo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAppIconUrl(connectedAppInfo.iconSlug, connectedAppInfo.iconColor)}
              width={12}
              height={12}
              alt={connectedAppInfo.name}
              style={{ display: "block", opacity: 0.7 }}
            />
          )}
          {syncText}
        </span>
      </div>
    </div>
  );
}

// ---- Page ----

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
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
        <Link
          href="/dashboard"
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            textDecoration: "none",
          }}
        >
          Sworn.
        </Link>
        <button
          onClick={() => router.push("/onboarding/goal")}
          style={{
            fontSize: 13,
            fontWeight: 500,
            background: "var(--text-primary)",
            color: "#fff",
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + New goal
        </button>
      </header>

      {/* Banners */}
      {hasPaymentMethod === false && (
        <div
          style={{
            background: "#FFF8EC",
            borderBottom: "0.5px solid rgba(181,130,40,0.25)",
            padding: "12px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 13, color: "#854F0B" }}>
            Add a payment method before setting a goal — it&apos;s what makes the commitment real.
          </p>
          <Link
            href="/dashboard/add-payment"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#854F0B",
              background: "rgba(181,130,40,0.12)",
              border: "0.5px solid rgba(181,130,40,0.3)",
              padding: "6px 14px",
              borderRadius: 8,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Add card →
          </Link>
        </div>
      )}
      {notifStatus === "idle" &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default" && (
          <div
            style={{
              background: "#F0F4FF",
              borderBottom: "0.5px solid rgba(37,99,235,0.2)",
              padding: "12px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <p style={{ fontSize: 13, color: "#1e40af" }}>
              Turn on reminders — Sworn will nudge you when it&apos;s time to log your session.
            </p>
            <button
              onClick={requestNotificationPermission}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#1e40af",
                background: "rgba(37,99,235,0.1)",
                border: "0.5px solid rgba(37,99,235,0.25)",
                padding: "6px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Enable reminders
            </button>
          </div>
        )}

      {/* Content */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            Your goals
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {goals.length} active {goals.length === 1 ? "goal" : "goals"}
          </p>
        </div>

        {goals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 20px" }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 8 }}>
              No goals yet.
            </p>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 28 }}>
              Set your first goal and put something on the line.
            </p>
            <button
              onClick={() => router.push("/onboarding/goal")}
              style={{
                fontSize: 14,
                fontWeight: 500,
                background: "var(--text-primary)",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Set your first goal
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goals.map((goal) => (
              <Link
                key={goal.id}
                href={`/dashboard/goals/${goal.id}`}
                style={{ textDecoration: "none" }}
              >
                <GoalCard goal={goal} />
              </Link>
            ))}
          </div>
        )}
      </main>

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
