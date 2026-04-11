"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getOnboarding, setOnboarding } from "@/lib/onboarding";

const STAKES = [
  {
    amount: 5,
    label: "Testing the waters",
    badge: "Good for a first goal",
    badgeColor: "var(--text-tertiary)",
    badgeBg: "var(--bg-secondary)",
  },
  {
    amount: 10,
    label: "Serious",
    badge: "Most popular starting point",
    badgeColor: "#185FA5",
    badgeBg: "#EBF3FC",
    default: true,
  },
  {
    amount: 30,
    label: "Committed",
    badge: "You really mean this one",
    badgeColor: "#3B6D11",
    badgeBg: "#EAF3DE",
  },
  {
    amount: 90,
    label: "No excuses",
    badge: "For the goal that cannot slip",
    badgeColor: "#854F0B",
    badgeBg: "#FAEEDA",
  },
];

export default function StakePage() {
  const { status } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState(10);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    const state = getOnboarding();
    if (!state.frequency) { router.replace("/onboarding/frequency"); return; }
  }, [status]);

  const handleContinue = () => {
    setOnboarding({ pledgeAmount: selected });
    router.push("/onboarding/connect");
  };

  if (status === "loading") return null;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "52px 24px 40px" }}>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Step 3 of 5
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 10 }}>
        How serious are you about this?
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
        The higher the stake, the harder it is to walk away.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {STAKES.map((stake) => {
          const isSelected = selected === stake.amount;
          return (
            <button
              key={stake.amount}
              onClick={() => setSelected(stake.amount)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                background: isSelected ? "var(--text-primary)" : "var(--bg-secondary)",
                border: `0.5px solid ${isSelected ? "var(--text-primary)" : "var(--border-md)"}`,
                borderRadius: 12,
                padding: "18px 20px",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 500, color: isSelected ? "#fff" : "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    ${stake.amount}
                  </span>
                  <span style={{ fontSize: 14, color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-secondary)" }}>
                    — {stake.label}
                  </span>
                </div>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 11,
                    fontWeight: 500,
                    color: isSelected ? "rgba(255,255,255,0.65)" : stake.badgeColor,
                    background: isSelected ? "rgba(255,255,255,0.12)" : stake.badgeBg,
                    borderRadius: 99,
                    padding: "2px 10px",
                  }}
                >
                  {stake.badge}
                </span>
              </div>

              {/* Selection indicator */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `1.5px solid ${isSelected ? "#fff" : "var(--border-md)"}`,
                  background: isSelected ? "#fff" : "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-primary)" }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleContinue}
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
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Set my stake →
      </button>

      <p style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
        You won&apos;t be charged anything today. Only if you miss.
      </p>
    </main>
  );
}
