"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

function fmtClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type TimerState = "running" | "stopped" | "done";

export default function TimerPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [goalTitle, setGoalTitle] = useState("");
  const [targetSecs, setTargetSecs] = useState(1800); // default 30 min
  const [elapsed, setElapsed] = useState(0);
  const [timerState, setTimerState] = useState<TimerState>("running");
  const [motivation, setMotivation] = useState("Stay consistent. Every session counts.");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ duration: number; metTarget: boolean } | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const motivationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") fetchGoal();
  }, [status]);

  const fetchGoal = async () => {
    const res = await fetch(`/api/goals/${id}`);
    if (!res.ok) { router.replace("/dashboard"); return; }
    const data = await res.json();
    setGoalTitle(data.goal.title ?? "");
    if (data.goal.target_duration_seconds) {
      setTargetSecs(data.goal.target_duration_seconds);
    }
  };

  // Tick
  useEffect(() => {
    if (timerState !== "running") return;
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerState]);

  // Rotating motivations every 30s
  useEffect(() => {
    if (!goalTitle || timerState !== "running") return;
    fetchMotivation();
    motivationTimer.current = setInterval(fetchMotivation, 30000);
    return () => { if (motivationTimer.current) clearInterval(motivationTimer.current); };
  }, [goalTitle, timerState]);

  const fetchMotivation = async () => {
    try {
      const res = await fetch(`/api/goals/${id}/motivate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.line) setMotivation(data.line);
      }
    } catch {
      // keep existing line
    }
  };

  const handleStop = async () => {
    setTimerState("stopped");
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (motivationTimer.current) clearInterval(motivationTimer.current);

    const metTarget = elapsed >= targetSecs;
    setResult({ duration: elapsed, metTarget });
    setSaving(true);

    await fetch(`/api/goals/${id}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duration_seconds: elapsed,
        met_target: metTarget,
        started_at: startedAt.current,
        stopped_at: new Date().toISOString(),
      }),
    });

    setSaving(false);
  };

  const progress = Math.min(elapsed / targetSecs, 1);
  const remaining = Math.max(targetSecs - elapsed, 0);

  if (status === "loading") return null;

  // Result screen
  if (timerState === "stopped" && result) {
    const mins = Math.round(result.duration / 60);
    const shortMins = Math.round(Math.max(targetSecs - result.duration, 0) / 60);

    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: result.metTarget ? "#EAF3DE" : "#FFF8EC",
            border: `0.5px solid ${result.metTarget ? "rgba(59,109,17,0.2)" : "rgba(133,79,11,0.2)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 24,
          }}
        >
          {result.metTarget ? "✓" : "~"}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", textAlign: "center", marginBottom: 10 }}>
          {result.metTarget
            ? `Session complete. ${mins} min logged.`
            : `Session saved. ${mins} min logged.`}
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", marginBottom: 36 }}>
          {result.metTarget
            ? "You hit your target. Keep the streak alive."
            : `${shortMins} min short of your goal — still counts.`}
        </p>

        {saving && (
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 20 }}>Saving…</p>
        )}

        <button
          onClick={() => router.push(`/dashboard/goals/${id}`)}
          style={{
            width: "100%",
            maxWidth: 400,
            fontSize: 15,
            fontWeight: 500,
            background: "var(--text-primary)",
            color: "#fff",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Back to goal →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        gap: 0,
      }}
    >
      {/* Goal name */}
      {goalTitle && (
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 32, textAlign: "center" }}>
          {goalTitle}
        </p>
      )}

      {/* Big clock */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 300,
          letterSpacing: "-0.04em",
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          marginBottom: 12,
        }}
      >
        {fmtClock(elapsed)}
      </div>

      {/* Target countdown */}
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, textAlign: "center" }}>
        {remaining > 0 ? `${Math.ceil(remaining / 60)} min remaining` : "Target reached ✓"}
      </p>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          height: 3,
          background: "var(--border-md)",
          borderRadius: 99,
          marginBottom: 36,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: progress >= 1 ? "#3B6D11" : "var(--text-primary)",
            borderRadius: 99,
            transition: "width 1s linear",
          }}
        />
      </div>

      {/* Motivation line */}
      <p
        style={{
          fontSize: 14,
          color: "var(--text-tertiary)",
          textAlign: "center",
          maxWidth: 280,
          lineHeight: 1.6,
          marginBottom: 44,
          minHeight: 44,
          transition: "opacity 0.5s ease",
        }}
      >
        {motivation}
      </p>

      {/* Stop button */}
      <button
        onClick={handleStop}
        style={{
          width: "100%",
          maxWidth: 320,
          fontSize: 15,
          fontWeight: 500,
          background: "none",
          color: "var(--text-primary)",
          padding: "13px 0",
          borderRadius: 10,
          border: "0.5px solid var(--border-md)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Stop session
      </button>

      <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 12 }}>
        Minimize · timer keeps running
      </p>
    </div>
  );
}
