"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { setOnboarding } from "@/lib/onboarding";
import { FEATURED_APPS, ALL_APPS, getAppByName, type AppInfo } from "@/lib/apps";
import type { ParsedGoal } from "@/app/api/onboarding/parse-goal/route";

const ACTIVITY_LABELS: Record<string, string> = {
  strava: "runs, rides, and swims",
  "apple-health": "workouts",
  duolingo: "lessons",
  todoist: "tasks",
  fitbit: "workouts",
  garmin: "activities",
  runkeeper: "runs",
  "oura-ring": "sleep sessions",
  whoop: "recovery sessions",
  notion: "tasks",
  github: "commits",
  rescuetime: "focus sessions",
  myfitnesspal: "meals",
};

function GoalPageInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [raw, setRaw] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [showAllApps, setShowAllApps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedGoal | null>(null);
  const [suggestedApp, setSuggestedApp] = useState<AppInfo | null>(null);
  const [error, setError] = useState("");
  const [presetGoalId, setPresetGoalId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    inputRef.current?.focus();

    const preset = searchParams.get("preset");
    if (preset && status === "authenticated") {
      setPresetGoalId(preset);
      fetch(`/api/goals/${preset}/preset`)
        .then((r) => r.json())
        .then((d) => {
          if (d.title) setRaw(d.title);
        })
        .catch(() => {});
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      const [goalsRes, payRes] = await Promise.all([
        fetch("/api/goals"),
        fetch("/api/user/payment-status"),
      ]);
      if (goalsRes.ok && payRes.ok) {
        const { goals } = await goalsRes.json();
        const { hasPaymentMethod } = await payRes.json();
        if (goals?.length > 0 && hasPaymentMethod) {
          router.replace("/dashboard");
        }
      }
    })();
  }, [status]);

  const parseGoal = async (): Promise<ParsedGoal | null> => {
    if (!raw.trim()) return null;
    const res = await fetch("/api/onboarding/parse-goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Something went wrong.");
      return null;
    }
    return res.json();
  };

  // State B — user pre-selected an app and clicks "Continue with [App]"
  const handleContinueWithApp = async () => {
    if (!selectedApp || !raw.trim()) return;
    setLoading(true);
    setError("");
    const parseData = await parseGoal();
    if (!parseData) { setLoading(false); return; }

    setOnboarding({
      raw,
      title: parseData.title,
      confirmation: parseData.confirmation,
      goalType: parseData.goalType,
      suggestedFrequency: parseData.suggestedFrequency,
      frequency: parseData.suggestedFrequency,
      suggestedApp: selectedApp.name,
      trackingApp: selectedApp.name,
      recommendedTrackingMethod: "connected",
    });
    router.push(`/onboarding/connect/${selectedApp.slug}`);
  };

  // State C — no app selected, parse + recommend
  const handleContinueNoApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raw.trim()) return;
    setError("");
    setLoading(true);
    setParsed(null);
    setSuggestedApp(null);

    const [parseData, recRes] = await Promise.all([
      parseGoal(),
      fetch("/api/onboarding/recommend-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      }),
    ]);

    if (!parseData) { setLoading(false); return; }

    setParsed(parseData);

    const recData = await recRes.json();
    if (recData?.app_name) {
      const app = getAppByName(recData.app_name);
      setSuggestedApp(app);
    }

    setLoading(false);
  };

  const proceedWithSuggestedApp = () => {
    if (!parsed || !suggestedApp) return;
    setOnboarding({
      raw,
      title: parsed.title,
      confirmation: parsed.confirmation,
      goalType: parsed.goalType,
      suggestedFrequency: parsed.suggestedFrequency,
      frequency: parsed.suggestedFrequency,
      suggestedApp: suggestedApp.name,
      trackingApp: suggestedApp.name,
      recommendedTrackingMethod: "connected",
      startedViaGoalId: presetGoalId,
      startedViaType: presetGoalId ? "discover" : null,
    });
    router.push(`/onboarding/connect/${suggestedApp.slug}`);
  };

  const proceedWithNoApp = () => {
    if (!parsed) return;
    setOnboarding({
      raw,
      title: parsed.title,
      confirmation: parsed.confirmation,
      goalType: parsed.goalType,
      suggestedFrequency: parsed.suggestedFrequency,
      trackingApp: null,
      recommendedTrackingMethod: "timer",
      startedViaGoalId: presetGoalId,
      startedViaType: presetGoalId ? "discover" : null,
    });
    router.push("/onboarding/frequency");
  };

  const handleAppTap = (app: AppInfo) => {
    setSelectedApp(selectedApp?.slug === app.slug ? null : app);
    setParsed(null);
    setSuggestedApp(null);
  };

  const handleChange = () => {
    setParsed(null);
    setSuggestedApp(null);
    setSelectedApp(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (status === "loading") return null;

  const displayedApps = showAllApps ? ALL_APPS : FEATURED_APPS;
  const isStateC = parsed !== null;
  const isStateB = selectedApp !== null && !isStateC;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "52px 24px 60px" }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "-0.025em",
          color: "var(--text-primary)",
          lineHeight: 1.2,
          marginBottom: 8,
        }}
      >
        Let&apos;s build your first commitment.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
        Type your goal the way you&apos;d say it out loud.
      </p>

      {/* Input */}
      <form onSubmit={isStateB ? (e) => { e.preventDefault(); handleContinueWithApp(); } : handleContinueNoApp}>
        <textarea
          ref={inputRef}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            if (isStateC) { setParsed(null); setSuggestedApp(null); }
          }}
          placeholder="I want to go for a run 4 times a week…"
          rows={3}
          disabled={isStateC}
          style={{
            width: "100%",
            fontSize: 16,
            color: "var(--text-primary)",
            background: isStateC ? "var(--bg-secondary)" : "var(--bg)",
            border: "0.5px solid var(--border-md)",
            borderRadius: 12,
            padding: "16px 18px",
            outline: "none",
            fontFamily: "inherit",
            resize: "none",
            lineHeight: 1.55,
            boxSizing: "border-box",
            transition: "background 0.2s ease",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (isStateB) handleContinueWithApp();
              else handleContinueNoApp(e as any);
            }
          }}
        />

        {!isStateC && (
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8, marginBottom: 20 }}>
            Press enter to continue — or connect a tracking app below
          </p>
        )}

        {error && (
          <p style={{ fontSize: 13, color: "#A32D2D", marginTop: 8 }}>{error}</p>
        )}

        {/* State B — green banner */}
        {isStateB && (
          <div
            style={{
              background: "#EAF3DE",
              border: "0.5px solid rgba(59,109,17,0.25)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "fadeSlideUp 0.2s ease",
            }}
          >
            <span style={{ fontSize: 13, color: "#3B6D11", fontWeight: 500 }}>
              Tracking via {selectedApp.name} — {ACTIVITY_LABELS[selectedApp.slug] ?? selectedApp.activity} logs automatically
            </span>
          </div>
        )}

        {!isStateC && (
          <button
            type="submit"
            disabled={!raw.trim() || loading}
            style={{
              width: "100%",
              fontSize: 15,
              fontWeight: 500,
              background: "var(--text-primary)",
              color: "#fff",
              padding: "14px 0",
              borderRadius: 10,
              border: "none",
              cursor: !raw.trim() || loading ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: !raw.trim() || loading ? 0.5 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            {loading
              ? "Thinking…"
              : isStateB
              ? `Continue with ${selectedApp!.name} →`
              : "Continue →"}
          </button>
        )}
      </form>

      {/* State C — AI confirmation panel */}
      {isStateC && (
        <div style={{ animation: "fadeSlideUp 0.25s ease" }}>
          {/* AI bubble */}
          <div
            style={{
              marginTop: 20,
              background: "var(--bg-secondary)",
              border: "0.5px solid var(--border)",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>S</span>
              </div>
              <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
                {suggestedApp
                  ? `Got it — ${parsed.confirmation}. ${suggestedApp.name} tracks this perfectly. Want to connect it so your ${ACTIVITY_LABELS[suggestedApp.slug] ?? suggestedApp.activity} log automatically?`
                  : parsed.confirmation}
              </p>
            </div>

            {suggestedApp ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={proceedWithSuggestedApp}
                  style={{
                    flex: 2,
                    fontSize: 14,
                    fontWeight: 500,
                    background: "var(--text-primary)",
                    color: "#fff",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Connect {suggestedApp.name} →
                </button>
                <button
                  onClick={proceedWithNoApp}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    background: "#fff",
                    border: "0.5px solid var(--border-md)",
                    padding: "12px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Skip for now
                </button>
              </div>
            ) : (
              <button
                onClick={proceedWithNoApp}
                style={{
                  width: "100%",
                  fontSize: 14,
                  fontWeight: 500,
                  background: "var(--text-primary)",
                  color: "#fff",
                  padding: "12px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Use built-in timer →
              </button>
            )}
          </div>

          <button
            onClick={handleChange}
            style={{
              width: "100%",
              marginTop: 10,
              fontSize: 13,
              color: "var(--text-tertiary)",
              background: "none",
              border: "0.5px solid var(--border)",
              padding: "10px 0",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Change my goal
          </button>
        </div>
      )}

      {/* App grid (States A & B) */}
      {!isStateC && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Or pick your tracking app
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}
          >
            {displayedApps.map((app) => {
              const isSel = selectedApp?.slug === app.slug;
              return (
                <button
                  key={app.slug}
                  onClick={() => handleAppTap(app)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: isSel ? "#EAF3DE" : "var(--bg-secondary)",
                    border: `0.5px solid ${isSel ? "rgba(59,109,17,0.4)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                    textAlign: "left",
                    position: "relative",
                  }}
                >
                  {isSel && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 10,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#3B6D11",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        color: "#fff",
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </div>
                  )}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: app.bg,
                      color: app.color,
                      border: app.border,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {app.letter}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isSel ? "#3B6D11" : "var(--text-primary)",
                    }}
                  >
                    {app.name}
                  </span>
                </button>
              );
            })}
          </div>

          {!showAllApps && (
            <button
              onClick={() => setShowAllApps(true)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 10,
                fontSize: 13,
                color: "var(--text-secondary)",
                background: "none",
                border: "0.5px solid var(--border)",
                padding: "10px 0",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "center",
              }}
            >
              + {ALL_APPS.length - FEATURED_APPS.length} more apps
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

export default function GoalPage() {
  return (
    <Suspense fallback={null}>
      <GoalPageInner />
    </Suspense>
  );
}
