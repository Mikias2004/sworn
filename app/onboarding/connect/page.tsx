"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getOnboarding, setOnboarding } from "@/lib/onboarding";

type App = {
  name: string;
  letter: string;
  bg: string;
  color: string;
  border?: string;
  goalTypes: Array<"fitness" | "productivity" | "learning" | "health" | "other" | "all">;
};

const ALL_APPS: App[] = [
  { name: "Apple Health", letter: "A", bg: "#1a1a1a", color: "#fff", goalTypes: ["fitness", "health"] },
  { name: "Strava",       letter: "S", bg: "#FC4C02", color: "#fff", goalTypes: ["fitness"] },
  { name: "Fitbit",       letter: "F", bg: "#00B0B9", color: "#fff", goalTypes: ["fitness", "health"] },
  { name: "Garmin",       letter: "G", bg: "#007CC3", color: "#fff", goalTypes: ["fitness"] },
  { name: "Runkeeper",    letter: "R", bg: "#3BB4E5", color: "#fff", goalTypes: ["fitness"] },
  { name: "Oura Ring",    letter: "O", bg: "#2D2D2D", color: "#C8A951", goalTypes: ["health", "fitness"] },
  { name: "Whoop",        letter: "W", bg: "#111",    color: "#00FF87", goalTypes: ["health", "fitness"] },
  { name: "Notion",       letter: "N", bg: "#fff",    color: "#0d0d0d", border: "0.5px solid rgba(0,0,0,0.14)", goalTypes: ["productivity"] },
  { name: "Todoist",      letter: "T", bg: "#DB4035", color: "#fff", goalTypes: ["productivity"] },
  { name: "GitHub",       letter: "G", bg: "#24292F", color: "#fff", goalTypes: ["productivity"] },
  { name: "RescueTime",   letter: "R", bg: "#1B4F72", color: "#fff", goalTypes: ["productivity"] },
  { name: "Duolingo",     letter: "D", bg: "#58CC02", color: "#fff", goalTypes: ["learning"] },
  { name: "Spotify",      letter: "S", bg: "#1DB954", color: "#fff", goalTypes: ["learning", "all"] },
];

function getRelevantApps(goalType: string): App[] {
  return ALL_APPS.filter(
    (a) =>
      a.goalTypes.includes(goalType as any) ||
      a.goalTypes.includes("all")
  );
}

export default function ConnectPage() {
  const { status } = useSession();
  const router = useRouter();

  const [state, setState] = useState<ReturnType<typeof getOnboarding>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    const s = getOnboarding();
    if (!s.pledgeAmount) { router.replace("/onboarding/stake"); return; }
    setState(s);
    // Pre-select the AI-suggested app if it exists in our list
    if (s.suggestedApp) {
      const match = ALL_APPS.find((a) =>
        a.name.toLowerCase().includes(s.suggestedApp!.toLowerCase()) ||
        s.suggestedApp!.toLowerCase().includes(a.name.toLowerCase())
      );
      if (match) setSelected(match.name);
    }
  }, [status]);

  const apps =
    state.goalType ? getRelevantApps(state.goalType) : ALL_APPS;

  // Fallback: show all if the relevant list is too short
  const displayApps = apps.length >= 3 ? apps : ALL_APPS;

  const handleConnect = () => {
    setOnboarding({ trackingApp: selected });
    router.push("/onboarding/payment");
  };

  const handleSkip = () => {
    setOnboarding({ trackingApp: null });
    router.push("/onboarding/payment");
  };

  if (status === "loading") return null;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "52px 24px 40px" }}>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Step 4 of 5
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 10 }}>
        Connect your apps.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
        Track automatically. No manual logging needed.
      </p>

      <div className="app-grid">
        {displayApps.map((app) => {
          const isSelected = selected === app.name;
          return (
            <button
              key={app.name}
              onClick={() => setSelected(isSelected ? null : app.name)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                background: isSelected ? "var(--text-primary)" : "var(--bg-secondary)",
                border: `0.5px solid ${isSelected ? "var(--text-primary)" : "var(--border)"}`,
                borderRadius: 12,
                padding: "18px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
                position: "relative",
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    color: "var(--text-primary)",
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
              )}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 500,
                  background: isSelected ? "rgba(255,255,255,0.15)" : app.bg,
                  color: isSelected ? "#fff" : app.color,
                  border: isSelected ? "none" : app.border,
                  flexShrink: 0,
                }}
              >
                {app.letter}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-secondary)",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {app.name}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConnect}
        disabled={!selected}
        style={{
          marginTop: 28,
          width: "100%",
          fontSize: 15,
          fontWeight: 500,
          background: "var(--text-primary)",
          color: "#fff",
          padding: "14px 0",
          borderRadius: 10,
          border: "none",
          cursor: selected ? "pointer" : "default",
          fontFamily: "inherit",
          opacity: selected ? 1 : 0.45,
          transition: "opacity 0.15s ease",
        }}
      >
        {selected ? `Connect ${selected} →` : "Select an app to continue"}
      </button>

      <button
        onClick={handleSkip}
        style={{
          display: "block",
          width: "100%",
          marginTop: 14,
          fontSize: 14,
          color: "var(--text-tertiary)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "center",
        }}
      >
        Skip for now, I&apos;ll log manually
      </button>

      <style>{`
        .app-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 480px) {
          .app-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </main>
  );
}
