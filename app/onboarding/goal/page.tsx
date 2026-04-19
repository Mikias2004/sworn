"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { setOnboarding } from "@/lib/onboarding";
import type { ParsedGoal } from "@/app/api/onboarding/parse-goal/route";
import type { AppRecommendation } from "@/app/api/onboarding/recommend-app/route";

export default function GoalPage() {
  const { status } = useSession();
  const router = useRouter();

  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedGoal | null>(null);
  const [recommendation, setRecommendation] = useState<AppRecommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    inputRef.current?.focus();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raw.trim()) return;
    setError("");
    setLoading(true);
    setRecLoading(true);
    setParsed(null);
    setRecommendation(null);

    // Parse goal and get recommendation in parallel
    const [parseRes, recRes] = await Promise.all([
      fetch("/api/onboarding/parse-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      }),
      fetch("/api/onboarding/recommend-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      }),
    ]);

    const parseData = await parseRes.json();
    if (!parseRes.ok) {
      setError(parseData.error ?? "Something went wrong.");
      setLoading(false);
      setRecLoading(false);
      return;
    }

    setParsed(parseData);
    setLoading(false);

    const recData = await recRes.json();
    setRecommendation(recData);
    setRecLoading(false);
  };

  const proceedWithApp = (appName: string | null) => {
    if (!parsed) return;
    setOnboarding({
      raw,
      title: parsed.title,
      confirmation: parsed.confirmation,
      goalType: parsed.goalType,
      suggestedFrequency: parsed.suggestedFrequency,
      suggestedApp: appName,
      trackingApp: appName,
    });
    router.push("/onboarding/frequency");
  };

  const handleChange = () => {
    setParsed(null);
    setRecommendation(null);
    setRaw("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (status === "loading") return null;

  const hasApp = recommendation?.app_name != null;
  const skipLabel =
    recommendation?.tracking_method === "manual"
      ? "Skip, log manually"
      : "Skip, use timer instead";

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "52px 24px 40px" }}>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Step 1 of 5
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 10 }}>
        Let&apos;s build your first commitment.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
        Type your goal the way you&apos;d say it out loud.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            if (parsed) { setParsed(null); setRecommendation(null); }
          }}
          placeholder="I want to go to the gym 4 times a week…"
          rows={3}
          disabled={!!parsed}
          style={{
            width: "100%",
            fontSize: 17,
            color: "var(--text-primary)",
            background: parsed ? "var(--bg-secondary)" : "var(--bg)",
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
              handleSubmit(e as any);
            }
          }}
        />

        {error && (
          <p style={{ fontSize: 13, color: "#A32D2D", marginTop: 10 }}>{error}</p>
        )}

        {!parsed && (
          <button
            type="submit"
            disabled={!raw.trim() || loading}
            style={{
              marginTop: 14,
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
            {loading ? "Thinking…" : "Continue →"}
          </button>
        )}
      </form>

      {/* AI confirmation panel */}
      {parsed && (
        <div
          style={{
            marginTop: 20,
            background: "var(--bg-secondary)",
            border: "0.5px solid var(--border)",
            borderRadius: 12,
            padding: "20px 20px",
            animation: "fadeSlideUp 0.25s ease",
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 500 }}>S</span>
            </div>
            <p style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>
              {parsed.confirmation}
            </p>
          </div>

          <button
            onClick={handleChange}
            style={{
              width: "100%",
              fontSize: 14,
              color: "var(--text-secondary)",
              background: "#fff",
              border: "0.5px solid var(--border-md)",
              padding: "10px 0",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Change it
          </button>
        </div>
      )}

      {/* App recommendation card */}
      {parsed && (recLoading || recommendation) && (
        <div
          style={{
            marginTop: 12,
            border: "0.5px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            animation: "fadeSlideUp 0.3s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "var(--text-primary)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>
              Sworn recommends
            </span>
          </div>

          <div style={{ background: "var(--bg-secondary)", padding: "16px 18px" }}>
            {recLoading ? (
              <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: 0 }}>
                Finding the best app for your goal…
              </p>
            ) : recommendation ? (
              <>
                <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 16, margin: "0 0 16px" }}>
                  {hasApp ? (
                    <>
                      <strong>{recommendation.app_name}</strong>
                      {" — "}
                      {recommendation.app_reason}
                    </>
                  ) : (
                    <>No app tracks this automatically. {recommendation.app_reason}</>
                  )}
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {hasApp ? (
                    <>
                      <button
                        onClick={() => proceedWithApp(recommendation.app_name)}
                        style={{
                          flex: 2,
                          minWidth: 120,
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
                        Connect {recommendation.app_name} →
                      </button>
                      <button
                        onClick={() => proceedWithApp(null)}
                        style={{
                          flex: 1,
                          minWidth: 100,
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
                        {skipLabel}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => proceedWithApp(null)}
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
              </>
            ) : null}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
