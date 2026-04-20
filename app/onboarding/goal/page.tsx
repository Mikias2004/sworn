"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  getOnboarding,
  setOnboarding,
  clearOnboarding,
  getStartDate,
} from "@/lib/onboarding";
import { ALL_APPS, FEATURED_APPS, getAppByName, getAppIconUrl, type AppInfo } from "@/lib/apps";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Step =
  | "input"
  | "ai_result"
  | "browse_apps"
  | "request_integration"
  | "frequency"
  | "tracking"
  | "stake"
  | "payment"
  | "done";

type AIResult = {
  parsed_title: string;
  activity_type: string;
  recommended_app: string | null;
  confidence: "high" | "medium" | "low";
  tracking_method: "connected" | "timer" | "manual_count" | "manual" | "uncertain";
  target_unit: string | null;
  target_count: number | null;
  target_duration_seconds: number | null;
  frequency: "daily" | "weekly" | "custom" | null;
  period_target: number | null;
};

const FREQ_OPTIONS = [
  { id: "4x_week", label: "4× per week", sub: "Good for gym, runs, practice" },
  { id: "daily", label: "Every day", sub: "Habits, streaks, consistency" },
  { id: "3x_week", label: "3× per week", sub: "Balanced and sustainable" },
  { id: "custom", label: "Custom", sub: "I'll describe it myself" },
] as const;

const DURATION_OPTIONS = [
  { seconds: 600, label: "10 min" },
  { seconds: 900, label: "15 min" },
  { seconds: 1800, label: "30 min" },
  { seconds: 2700, label: "45 min" },
  { seconds: 3600, label: "1 hour" },
];

const STAKES = [
  { amount: 5, label: "Testing the waters", badge: "Good for a first goal", badgeColor: "var(--text-tertiary)", badgeBg: "var(--bg-secondary)" },
  { amount: 10, label: "Serious", badge: "Most popular starting point", badgeColor: "#185FA5", badgeBg: "#EBF3FC" },
  { amount: 30, label: "Committed", badge: "You really mean this one", badgeColor: "#3B6D11", badgeBg: "#EAF3DE" },
  { amount: 90, label: "No excuses", badge: "For the goal that cannot slip", badgeColor: "#854F0B", badgeBg: "#FAEEDA" },
];

function mapAIFrequency(aiFreq: string | null | undefined, periodTarget: number | null): string {
  if (!aiFreq) return "4x_week";
  if (aiFreq === "daily") return "daily";
  if (aiFreq === "weekly") {
    if (periodTarget === 3) return "3x_week";
    if (periodTarget === 4) return "4x_week";
    return "4x_week";
  }
  return "4x_week";
}

function frequencyLabel(freq: string, customFreq: string): string {
  if (freq === "daily") return "Every day";
  if (freq === "4x_week") return "4× per week";
  if (freq === "3x_week") return "3× per week";
  if (freq === "custom") return customFreq || "Custom";
  return freq;
}

// ---- Stripe SetupForm (must live inside <Elements>) ----
function SetupForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setLoading(true);

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/onboarding/goal` },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    if (setupIntent?.payment_method) {
      await fetch("/api/stripe/save-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method_id: setupIntent.payment_method }),
      });
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "0.5px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <PaymentElement options={{ layout: "tabs" }} />
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
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: "100%",
          fontSize: 15,
          fontWeight: 500,
          background: "var(--text-primary)",
          color: "#fff",
          padding: "14px 0",
          borderRadius: 10,
          border: "none",
          cursor: !stripe || loading ? "default" : "pointer",
          fontFamily: "inherit",
          opacity: !stripe || loading ? 0.6 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {loading ? "Saving…" : "Add card and go live →"}
      </button>

      <p
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          textAlign: "center",
          marginTop: 14,
          lineHeight: 1.55,
        }}
      >
        Secured by Stripe. Your card details never touch our servers.
        <br />
        You won&apos;t be charged today — only if you miss your goal.
      </p>
    </form>
  );
}

// ---- App grid tile ----
function AppTile({
  app,
  selected,
  onClick,
}: {
  app: AppInfo;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: selected ? "#EAF3DE" : "var(--bg-secondary)",
        border: `0.5px solid ${selected ? "rgba(59,109,17,0.4)" : "var(--border)"}`,
        borderRadius: 10,
        padding: "12px 14px",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        position: "relative",
        transition: "all 0.15s ease",
      }}
    >
      {selected && (
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
          background: "rgba(0,0,0,0.04)",
          border: "0.5px solid rgba(0,0,0,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAppIconUrl(app.iconSlug, app.iconColor)}
          width={22}
          height={22}
          alt={app.name}
          style={{ display: "block" }}
        />
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: selected ? "#3B6D11" : "var(--text-primary)",
        }}
      >
        {app.name}
      </span>
    </button>
  );
}

// ---- Progress bar ----
function ProgressBar({
  step,
  hasPaymentMethod,
}: {
  step: Step;
  hasPaymentMethod: boolean | null;
}) {
  const skipPayment = hasPaymentMethod === true;
  // Ordered visible steps for progress calculation
  const steps: Step[] = ["input", "frequency", "tracking", "stake"];
  if (!skipPayment) steps.push("payment");
  steps.push("done");

  const effectiveStep =
    step === "ai_result" || step === "browse_apps" || step === "request_integration"
      ? "input"
      : step;

  const idx = steps.indexOf(effectiveStep as Step);
  const pct = idx < 0 ? 0 : (idx / (steps.length - 1)) * 100;

  return (
    <div
      style={{
        height: 3,
        background: "var(--border)",
        borderRadius: 99,
        overflow: "hidden",
        marginBottom: 36,
      }}
    >
      <div
        style={{
          height: "100%",
          background: "var(--text-primary)",
          borderRadius: 99,
          width: `${pct}%`,
          transition: "width 0.35s ease",
        }}
      />
    </div>
  );
}

// ---- Main page inner ----
function GoalFlowInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [step, setStep] = useState<Step>("input");

  // Input step
  const [raw, setRaw] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [showAllApps, setShowAllApps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState("");

  // AI result
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [suggestedApp, setSuggestedApp] = useState<AppInfo | null>(null);

  // Goal params
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("4x_week");
  const [customFreq, setCustomFreq] = useState("");
  const [trackingApp, setTrackingApp] = useState<string | null>(null);
  const [trackingMethod, setTrackingMethod] = useState<string>("manual");
  const [targetDuration, setTargetDuration] = useState<number | null>(null);
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [targetUnit, setTargetUnit] = useState<string | null>(null);
  const [periodTarget, setPeriodTarget] = useState<number | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState(10);

  // Payment
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentFetchError, setPaymentFetchError] = useState("");

  // Integration request
  const [reqAppName, setReqAppName] = useState("");
  const [reqUseCase, setReqUseCase] = useState("");
  const [reqSubmitted, setReqSubmitted] = useState(false);

  // Done
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    // Check payment method
    fetch("/api/user/payment-status")
      .then((r) => r.json())
      .then((d) => setHasPaymentMethod(d.hasPaymentMethod ?? false))
      .catch(() => setHasPaymentMethod(false));

    // Detect return from connect flow
    const ob = getOnboarding();
    if (ob.trackingApp && ob.title) {
      setTitle(ob.title);
      setTrackingApp(ob.trackingApp);
      setTrackingMethod("connected");
      if (ob.suggestedFrequency) setFrequency(ob.suggestedFrequency);
      setStep("frequency");
      return;
    }

    // Handle Stripe 3DS redirect
    const redirectStatus = searchParams.get("redirect_status");
    if (redirectStatus === "succeeded") {
      const ob2 = getOnboarding();
      if (ob2.title) {
        setTitle(ob2.title || "");
        if (ob2.suggestedFrequency) setFrequency(ob2.suggestedFrequency);
        saveGoalDirectly(ob2 as any);
        return;
      }
    }

    clearOnboarding();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [status]);

  const saveGoalDirectly = async (ob: any) => {
    setStep("done");
    setSaving(true);
    const freq = ob.frequency ?? ob.suggestedFrequency ?? "4x_week";
    const res = await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: ob.title,
        frequency: freq,
        pledge_amount: ob.pledgeAmount ?? 10,
        tracking_app: ob.trackingApp ?? null,
        tracking_method: ob.trackingApp ? "connected" : "manual",
        connected_app: ob.trackingApp ?? null,
        start_date: getStartDate(freq).toISOString(),
      }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); clearOnboarding(); }
    else {
      const d = await res.json();
      setSaveError(d.error ?? "Failed to save goal.");
    }
  };

  const callParseGoal = async (): Promise<AIResult | null> => {
    const res = await fetch("/api/ai/parse-goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal_text: raw }),
    });
    if (!res.ok) {
      const d = await res.json();
      setInputError(d.error ?? "Something went wrong.");
      return null;
    }
    return res.json();
  };

  const handleInputSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!raw.trim()) return;
    setLoading(true);
    setInputError("");

    const result = await callParseGoal();
    if (!result) { setLoading(false); return; }

    setAiResult(result);
    setTitle(result.parsed_title);
    setTargetDuration(result.target_duration_seconds);
    setTargetCount(result.target_count);
    setTargetUnit(result.target_unit);
    setPeriodTarget(result.period_target);
    setFrequency(mapAIFrequency(result.frequency, result.period_target));

    if (selectedApp) {
      // Pre-selected app: save state and navigate to connect
      setTrackingApp(selectedApp.name);
      setTrackingMethod("connected");
      setOnboarding({
        raw,
        title: result.parsed_title,
        suggestedFrequency: mapAIFrequency(result.frequency, result.period_target) as any,
      });
      setLoading(false);
      router.push(`/onboarding/connect/${selectedApp.slug}?next=/onboarding/goal`);
      return;
    }

    if (result.recommended_app) {
      setSuggestedApp(getAppByName(result.recommended_app));
    }

    setLoading(false);
    setStep("ai_result");
  };

  const navigateToConnect = (app: AppInfo) => {
    setOnboarding({
      raw,
      title,
      suggestedFrequency: frequency as any,
    });
    router.push(`/onboarding/connect/${app.slug}?next=/onboarding/goal`);
  };

  const advanceAfterTracking = (method: string) => {
    const shouldSkipFreq =
      aiResult?.confidence === "high" &&
      aiResult.frequency != null &&
      aiResult.frequency !== "custom";

    const needsTrackingConfig =
      (method === "timer" || method === "manual_count") && !trackingApp;

    if (!shouldSkipFreq) {
      setStep("frequency");
    } else if (needsTrackingConfig) {
      setStep("tracking");
    } else {
      setStep("stake");
    }
  };

  const handleAIResultContinue = (method: string) => {
    setTrackingMethod(method);
    advanceAfterTracking(method);
  };

  const handleFrequencyContinue = () => {
    const needsTrackingConfig =
      (trackingMethod === "timer" || trackingMethod === "manual_count") && !trackingApp;
    if (needsTrackingConfig) {
      setStep("tracking");
    } else {
      setStep("stake");
    }
  };

  const handleStakeContinue = () => {
    if (hasPaymentMethod === true) {
      triggerSave();
    } else {
      setOnboarding({
        raw,
        title,
        frequency: frequency as any,
        suggestedFrequency: frequency as any,
        pledgeAmount,
        trackingApp: trackingApp ?? undefined,
        recommendedTrackingMethod: (trackingApp ? "connected" : trackingMethod === "timer" ? "timer" : "manual") as any,
      });
      fetch("/api/stripe/setup-intent", { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          if (d.clientSecret) setClientSecret(d.clientSecret);
          else setPaymentFetchError(d.error ?? "Failed to start payment setup.");
        })
        .catch(() => setPaymentFetchError("Failed to reach server."));
      setStep("payment");
    }
  };

  const triggerSave = async () => {
    const freq = frequency === "custom" ? (customFreq.trim() || "custom") : frequency;
    setStep("done");
    setSaving(true);
    setSaveError("");

    const res = await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        frequency: freq,
        pledge_amount: pledgeAmount,
        tracking_app: trackingApp ?? null,
        tracking_method: trackingApp ? "connected" : trackingMethod,
        connected_app: trackingApp ?? null,
        target_duration_seconds: targetDuration,
        target_count: targetCount,
        target_unit: targetUnit,
        period_target: periodTarget,
        start_date: getStartDate(freq).toISOString(),
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      clearOnboarding();
    } else {
      const d = await res.json();
      setSaveError(d.error ?? "Failed to save goal. Please try again.");
    }
  };

  const handleIntegrationRequest = async () => {
    if (!reqAppName.trim()) return;
    await fetch("/api/integration-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_name: reqAppName.trim(), use_case: reqUseCase.trim() }),
    });
    setReqSubmitted(true);
    setTrackingMethod("manual");
    setTimeout(() => setStep("frequency"), 1500);
  };

  if (status === "loading") return null;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 80px" }}>
      {step !== "done" && (
        <ProgressBar step={step} hasPaymentMethod={hasPaymentMethod} />
      )}

      {/* ---- STEP: input ---- */}
      {step === "input" && (
        <>
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
            What do you want to commit to?
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Type your goal the way you&apos;d say it out loud.
          </p>

          <form onSubmit={handleInputSubmit}>
            <textarea
              ref={inputRef}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="I want to go for a run 4 times a week…"
              rows={3}
              style={{
                width: "100%",
                fontSize: 16,
                color: "var(--text-primary)",
                background: "var(--bg)",
                border: "0.5px solid var(--border-md)",
                borderRadius: 12,
                padding: "16px 18px",
                outline: "none",
                fontFamily: "inherit",
                resize: "none",
                lineHeight: 1.55,
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleInputSubmit();
                }
              }}
            />

            {selectedApp && (
              <div
                style={{
                  background: "#EAF3DE",
                  border: "0.5px solid rgba(59,109,17,0.25)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginTop: 10,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 13, color: "#3B6D11", fontWeight: 500 }}>
                  Will connect via {selectedApp.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  style={{
                    fontSize: 12,
                    color: "#3B6D11",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    opacity: 0.7,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {inputError && (
              <p style={{ fontSize: 13, color: "#A32D2D", marginTop: 8 }}>
                {inputError}
              </p>
            )}

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
              {loading
                ? "Thinking…"
                : selectedApp
                ? `Continue with ${selectedApp.name} →`
                : "Continue →"}
            </button>
          </form>

          <div style={{ marginTop: 32 }}>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-tertiary)",
                marginBottom: 12,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Or pick your tracking app first
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 8,
              }}
            >
              {(showAllApps ? ALL_APPS : FEATURED_APPS).map((app) => (
                <AppTile
                  key={app.slug}
                  app={app}
                  selected={selectedApp?.slug === app.slug}
                  onClick={() =>
                    setSelectedApp(selectedApp?.slug === app.slug ? null : app)
                  }
                />
              ))}
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
        </>
      )}

      {/* ---- STEP: ai_result ---- */}
      {step === "ai_result" && aiResult && (
        <div style={{ animation: "fadeSlideUp 0.2s ease" }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 24,
              alignItems: "flex-start",
            }}
          >
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
                marginTop: 2,
              }}
            >
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>S</span>
            </div>
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--border)",
                borderRadius: 12,
                padding: "16px 18px",
                flex: 1,
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                {title}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                }}
              >
                {aiResult.confidence === "high" && aiResult.recommended_app && suggestedApp
                  ? `${suggestedApp.name} tracks this automatically. Connect it to skip manual logging.`
                  : aiResult.tracking_method === "timer"
                  ? `I'll track your sessions with a built-in timer.`
                  : aiResult.tracking_method === "manual_count"
                  ? `I'll count your ${aiResult.target_unit ?? "reps"} each session.`
                  : aiResult.tracking_method === "uncertain" || aiResult.confidence === "low"
                  ? `I'm not sure which app fits best — want to browse options or continue without?`
                  : `I'll track this as a daily habit.`}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {aiResult.confidence === "high" && aiResult.recommended_app && suggestedApp ? (
              <>
                <button
                  onClick={() => navigateToConnect(suggestedApp)}
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
                  }}
                >
                  Connect {suggestedApp.name} →
                </button>
                <button
                  onClick={() => handleAIResultContinue("manual")}
                  style={{
                    width: "100%",
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    background: "var(--bg-secondary)",
                    border: "0.5px solid var(--border-md)",
                    padding: "12px 0",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Skip — track manually
                </button>
              </>
            ) : aiResult.tracking_method === "timer" ? (
              <button
                onClick={() => handleAIResultContinue("timer")}
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
                }}
              >
                Use built-in timer →
              </button>
            ) : aiResult.tracking_method === "manual_count" ? (
              <button
                onClick={() => handleAIResultContinue("manual_count")}
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
                }}
              >
                Looks right →
              </button>
            ) : aiResult.tracking_method === "uncertain" || aiResult.confidence === "low" ? (
              <>
                <button
                  onClick={() => setStep("browse_apps")}
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
                  }}
                >
                  Browse tracking apps →
                </button>
                <button
                  onClick={() => setStep("request_integration")}
                  style={{
                    width: "100%",
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    background: "var(--bg-secondary)",
                    border: "0.5px solid var(--border-md)",
                    padding: "12px 0",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Request an app integration
                </button>
                <button
                  onClick={() => handleAIResultContinue("manual")}
                  style={{
                    width: "100%",
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
                  Continue without tracking
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAIResultContinue("manual")}
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
                }}
              >
                Looks right →
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setStep("input");
              setAiResult(null);
              setSuggestedApp(null);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            style={{
              marginTop: 10,
              width: "100%",
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

      {/* ---- STEP: browse_apps ---- */}
      {step === "browse_apps" && (
        <div style={{ animation: "fadeSlideUp 0.2s ease" }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Pick a tracking app
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Connect an app to verify your progress automatically.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {ALL_APPS.map((app) => (
              <AppTile
                key={app.slug}
                app={app}
                selected={false}
                onClick={() => navigateToConnect(app)}
              />
            ))}
          </div>

          <button
            onClick={() => setStep("request_integration")}
            style={{
              width: "100%",
              fontSize: 14,
              color: "var(--text-secondary)",
              background: "var(--bg-secondary)",
              border: "0.5px solid var(--border-md)",
              padding: "12px 0",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: 8,
            }}
          >
            Don&apos;t see your app? Request it
          </button>
          <button
            onClick={() => {
              setTrackingMethod("manual");
              setStep("frequency");
            }}
            style={{
              width: "100%",
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
            Continue without tracking
          </button>
        </div>
      )}

      {/* ---- STEP: request_integration ---- */}
      {step === "request_integration" && (
        <div style={{ animation: "fadeSlideUp 0.2s ease" }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Request an integration
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Tell us which app you use and we&apos;ll prioritize it.
          </p>

          {reqSubmitted ? (
            <div
              style={{
                background: "#EAF3DE",
                border: "0.5px solid rgba(59,109,17,0.2)",
                borderRadius: 12,
                padding: 20,
                textAlign: "center",
                animation: "fadeSlideUp 0.2s ease",
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#3B6D11",
                }}
              >
                Request sent. We&apos;ll get to it!
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginTop: 4,
                }}
              >
                Continuing to set up your goal…
              </p>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={reqAppName}
                onChange={(e) => setReqAppName(e.target.value)}
                placeholder="App name (e.g. Habitica, Noom…)"
                autoFocus
                style={{
                  width: "100%",
                  fontSize: 15,
                  color: "var(--text-primary)",
                  background: "var(--bg)",
                  border: "0.5px solid var(--border-md)",
                  borderRadius: 10,
                  padding: "13px 16px",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  marginBottom: 10,
                }}
              />
              <textarea
                value={reqUseCase}
                onChange={(e) => setReqUseCase(e.target.value)}
                placeholder="How would you use it? (optional)"
                rows={2}
                style={{
                  width: "100%",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: "var(--bg)",
                  border: "0.5px solid var(--border-md)",
                  borderRadius: 10,
                  padding: "13px 16px",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "none",
                  marginBottom: 14,
                }}
              />
              <button
                onClick={handleIntegrationRequest}
                disabled={!reqAppName.trim()}
                style={{
                  width: "100%",
                  fontSize: 15,
                  fontWeight: 500,
                  background: "var(--text-primary)",
                  color: "#fff",
                  padding: "14px 0",
                  borderRadius: 10,
                  border: "none",
                  cursor: !reqAppName.trim() ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: !reqAppName.trim() ? 0.5 : 1,
                  marginBottom: 8,
                }}
              >
                Send request →
              </button>
              <button
                onClick={() => {
                  setTrackingMethod("manual");
                  setStep("frequency");
                }}
                style={{
                  width: "100%",
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
                Skip — continue without tracking
              </button>
            </>
          )}
        </div>
      )}

      {/* ---- STEP: frequency ---- */}
      {step === "frequency" && (
        <div style={{ animation: "fadeSlideUp 0.2s ease" }}>
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
            How often?
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            Pick the schedule that makes sense for this goal.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {FREQ_OPTIONS.map((opt) => {
              const isSel = frequency === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFrequency(opt.id)}
                  style={{
                    background: isSel ? "var(--text-primary)" : "var(--bg-secondary)",
                    border: `0.5px solid ${isSel ? "var(--text-primary)" : "var(--border-md)"}`,
                    borderRadius: 12,
                    padding: "20px 18px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                >
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: isSel ? "#fff" : "var(--text-primary)",
                      marginBottom: 5,
                    }}
                  >
                    {opt.label}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: isSel ? "rgba(255,255,255,0.65)" : "var(--text-tertiary)",
                      lineHeight: 1.4,
                    }}
                  >
                    {opt.sub}
                  </p>
                </button>
              );
            })}
          </div>

          {frequency === "custom" && (
            <input
              type="text"
              value={customFreq}
              onChange={(e) => setCustomFreq(e.target.value)}
              placeholder="e.g. Every weekday morning"
              autoFocus
              style={{
                width: "100%",
                fontSize: 15,
                color: "var(--text-primary)",
                background: "var(--bg)",
                border: "0.5px solid var(--border-md)",
                borderRadius: 10,
                padding: "13px 16px",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                marginBottom: 14,
              }}
            />
          )}

          <button
            onClick={handleFrequencyContinue}
            disabled={frequency === "custom" && !customFreq.trim()}
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
              opacity: frequency === "custom" && !customFreq.trim() ? 0.45 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            This looks right →
          </button>
        </div>
      )}

      {/* ---- STEP: tracking ---- */}
      {step === "tracking" && (
        <div style={{ animation: "fadeSlideUp 0.2s ease" }}>
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
            {trackingMethod === "timer" ? "Set your session length" : "Set your target"}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            {trackingMethod === "timer"
              ? "How long is each session?"
              : `How many ${targetUnit ?? "reps"} each session?`}
          </p>

          {trackingMethod === "timer" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {DURATION_OPTIONS.map((opt) => {
                const isSel = targetDuration === opt.seconds;
                return (
                  <button
                    key={opt.seconds}
                    onClick={() => setTargetDuration(opt.seconds)}
                    style={{
                      background: isSel ? "var(--text-primary)" : "var(--bg-secondary)",
                      border: `0.5px solid ${isSel ? "var(--text-primary)" : "var(--border-md)"}`,
                      borderRadius: 10,
                      padding: "16px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: isSel ? "#fff" : "var(--text-primary)",
                      }}
                    >
                      {opt.label}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input
                type="number"
                value={targetCount ?? ""}
                onChange={(e) =>
                  setTargetCount(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="100"
                min={1}
                style={{
                  flex: 1,
                  fontSize: 18,
                  color: "var(--text-primary)",
                  background: "var(--bg)",
                  border: "0.5px solid var(--border-md)",
                  borderRadius: 10,
                  padding: "13px 16px",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="text"
                value={targetUnit ?? ""}
                onChange={(e) => setTargetUnit(e.target.value || null)}
                placeholder="pushups"
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: "var(--text-primary)",
                  background: "var(--bg)",
                  border: "0.5px solid var(--border-md)",
                  borderRadius: 10,
                  padding: "13px 16px",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          <button
            onClick={() => setStep("stake")}
            disabled={trackingMethod === "timer" ? !targetDuration : !targetCount}
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
              opacity:
                (trackingMethod === "timer" ? !targetDuration : !targetCount) ? 0.45 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            Set target →
          </button>
          <button
            onClick={() => {
              setTargetDuration(null);
              setTargetCount(null);
              setStep("stake");
            }}
            style={{
              marginTop: 8,
              width: "100%",
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
            Skip for now
          </button>
        </div>
      )}

      {/* ---- STEP: stake ---- */}
      {step === "stake" && (
        <div style={{ animation: "fadeSlideUp 0.2s ease" }}>
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
            How serious are you?
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            The higher the stake, the harder it is to walk away.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {STAKES.map((stake) => {
              const isSel = pledgeAmount === stake.amount;
              return (
                <button
                  key={stake.amount}
                  onClick={() => setPledgeAmount(stake.amount)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    background: isSel ? "var(--text-primary)" : "var(--bg-secondary)",
                    border: `0.5px solid ${
                      isSel ? "var(--text-primary)" : "var(--border-md)"
                    }`,
                    borderRadius: 12,
                    padding: "18px 20px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 500,
                          color: isSel ? "#fff" : "var(--text-primary)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        ${stake.amount}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: isSel ? "rgba(255,255,255,0.8)" : "var(--text-secondary)",
                        }}
                      >
                        — {stake.label}
                      </span>
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        fontWeight: 500,
                        color: isSel ? "rgba(255,255,255,0.65)" : stake.badgeColor,
                        background: isSel ? "rgba(255,255,255,0.12)" : stake.badgeBg,
                        borderRadius: 99,
                        padding: "2px 10px",
                      }}
                    >
                      {stake.badge}
                    </span>
                  </div>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `1.5px solid ${isSel ? "#fff" : "var(--border-md)"}`,
                      background: isSel ? "#fff" : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSel && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--text-primary)",
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleStakeContinue}
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
            }}
          >
            Set my stake →
          </button>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              textAlign: "center",
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            You won&apos;t be charged anything today. Only if you miss.
          </p>
        </div>
      )}

      {/* ---- STEP: payment ---- */}
      {step === "payment" && (
        <div style={{ animation: "fadeSlideUp 0.2s ease" }}>
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
            Add your payment method.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            You won&apos;t be charged today. Only if you miss your goal.
          </p>

          {paymentFetchError && (
            <p
              style={{
                fontSize: 13,
                color: "#A32D2D",
                background: "#FDF2F2",
                padding: "10px 14px",
                borderRadius: 8,
                border: "0.5px solid rgba(163,45,45,0.2)",
                marginBottom: 20,
              }}
            >
              {paymentFetchError}
            </p>
          )}

          {!clientSecret && !paymentFetchError ? (
            <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#0d0d0d",
                    colorBackground: "#ffffff",
                    colorText: "#0d0d0d",
                    colorDanger: "#A32D2D",
                    fontFamily: "Inter, sans-serif",
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <SetupForm onSuccess={triggerSave} />
            </Elements>
          ) : null}
        </div>
      )}

      {/* ---- STEP: done ---- */}
      {step === "done" && (
        <div
          style={{
            textAlign: "center",
            paddingTop: 12,
            animation: "fadeSlideUp 0.25s ease",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: saving ? "var(--bg-secondary)" : "#EAF3DE",
              border: `0.5px solid ${saving ? "var(--border)" : "rgba(59,109,17,0.2)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
              transition: "all 0.3s ease",
            }}
          >
            <span
              style={{
                fontSize: 28,
                color: saving ? "var(--text-tertiary)" : "#3B6D11",
              }}
            >
              {saving ? "…" : "✓"}
            </span>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: 10,
              lineHeight: 1.15,
            }}
          >
            {saving
              ? "Setting things up…"
              : trackingApp
              ? `${trackingApp} connected.`
              : "You're live."}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            {saving
              ? "Saving your commitment…"
              : trackingApp
              ? `Every activity you log in ${trackingApp} counts toward your goal automatically.`
              : "Your commitment is set. Keep your word."}
          </p>

          {saveError && (
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
              {saveError}
            </p>
          )}

          {saved && (
            <>
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
                {[
                  { label: "Goal", value: title },
                  {
                    label: "Tracking",
                    value: trackingApp
                      ? trackingApp
                      : trackingMethod === "timer"
                      ? "Built-in timer"
                      : "Manual",
                  },
                  {
                    label: "Schedule",
                    value: frequencyLabel(frequency, customFreq),
                  },
                  { label: "Stake", value: `$${pledgeAmount}` },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 20px",
                      borderBottom:
                        i < arr.length - 1 ? "0.5px solid var(--border)" : "none",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-tertiary)",
                        flexShrink: 0,
                      }}
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
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  display: "block",
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
                  marginBottom: 10,
                }}
              >
                Go to my dashboard →
              </button>
              <button
                onClick={() => {
                  clearOnboarding();
                  setStep("input");
                  setRaw("");
                  setAiResult(null);
                  setSuggestedApp(null);
                  setTitle("");
                  setTrackingApp(null);
                  setTrackingMethod("manual");
                  setTargetDuration(null);
                  setTargetCount(null);
                  setTargetUnit(null);
                  setPledgeAmount(10);
                  setSaved(false);
                  setSaveError("");
                  setClientSecret(null);
                  setTimeout(() => inputRef.current?.focus(), 50);
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
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          main { padding: 32px 20px 60px !important; }
        }
      `}</style>
    </main>
  );
}

export default function GoalPage() {
  return (
    <Suspense fallback={null}>
      <GoalFlowInner />
    </Suspense>
  );
}
