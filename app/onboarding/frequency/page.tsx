"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getOnboarding, setOnboarding } from "@/lib/onboarding";

type FreqOption = {
  id: "daily" | "4x_week" | "3x_week" | "custom";
  label: string;
  sub: string;
};

const OPTIONS: FreqOption[] = [
  { id: "4x_week", label: "4× per week", sub: "Good for gym, runs, practice" },
  { id: "daily",   label: "Every day",   sub: "Habits, streaks, consistency" },
  { id: "3x_week", label: "3× per week", sub: "Balanced and sustainable" },
  { id: "custom",  label: "Custom",      sub: "I'll describe it myself" },
];

// Map suggested frequency from AI to our option IDs
function mapSuggested(s: string | undefined): FreqOption["id"] {
  if (s === "daily") return "daily";
  if (s === "3x_week") return "3x_week";
  if (s === "4x_week") return "4x_week";
  return "4x_week"; // sensible default
}

export default function FrequencyPage() {
  const { status } = useSession();
  const router = useRouter();

  const [selected, setSelected] = useState<FreqOption["id"] | null>(null);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    const state = getOnboarding();
    if (!state.title) { router.replace("/onboarding/goal"); return; }
    setSelected(mapSuggested(state.suggestedFrequency));
  }, [status]);

  const handleContinue = () => {
    if (!selected) return;
    const freq = selected === "custom" ? custom.trim() || "custom" : selected;
    setOnboarding({ frequency: freq });
    router.push("/onboarding/stake");
  };

  if (status === "loading") return null;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "52px 24px 40px" }}>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Step 2 of 5
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 10 }}>
        How often?
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
        Pick the schedule that makes sense for this goal.
      </p>

      <div className="freq-grid">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              style={{
                background: isSelected ? "var(--text-primary)" : "var(--bg-secondary)",
                border: `0.5px solid ${isSelected ? "var(--text-primary)" : "var(--border-md)"}`,
                borderRadius: 12,
                padding: "20px 18px",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 500, color: isSelected ? "#fff" : "var(--text-primary)", marginBottom: 5 }}>
                {opt.label}
              </p>
              <p style={{ fontSize: 12, color: isSelected ? "rgba(255,255,255,0.65)" : "var(--text-tertiary)", lineHeight: 1.4 }}>
                {opt.sub}
              </p>
            </button>
          );
        })}
      </div>

      {selected === "custom" && (
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
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
            marginTop: 14,
          }}
        />
      )}

      <button
        onClick={handleContinue}
        disabled={!selected || (selected === "custom" && !custom.trim())}
        style={{
          marginTop: 24,
          width: "100%",
          fontSize: 15,
          fontWeight: 500,
          background: "var(--text-primary)",
          color: "#fff",
          padding: "14px 0",
          borderRadius: 10,
          border: "none",
          cursor: !selected ? "default" : "pointer",
          fontFamily: "inherit",
          opacity: !selected || (selected === "custom" && !custom.trim()) ? 0.45 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        This looks right →
      </button>

      <style>{`
        .freq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 480px) {
          .freq-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
