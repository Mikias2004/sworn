"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getOnboarding, setOnboarding } from "@/lib/onboarding";
import { getAppIconUrl } from "@/lib/apps";

type App = {
  name: string;
  iconSlug: string;
  iconColor: string;
  goalTypes: Array<"fitness" | "productivity" | "learning" | "health" | "other" | "all">;
};

const ALL_APPS: App[] = [
  { name: "Apple Health", iconSlug: "apple",       iconColor: "000000", goalTypes: ["fitness", "health"] },
  { name: "Strava",       iconSlug: "strava",      iconColor: "FC4C02", goalTypes: ["fitness"] },
  { name: "Fitbit",       iconSlug: "fitbit",      iconColor: "00B0B9", goalTypes: ["fitness", "health"] },
  { name: "Garmin",       iconSlug: "garmin",      iconColor: "007CC3", goalTypes: ["fitness"] },
  { name: "Runkeeper",    iconSlug: "runkeeper",   iconColor: "1F63FF", goalTypes: ["fitness"] },
  { name: "Oura Ring",    iconSlug: "oura",        iconColor: "000000", goalTypes: ["health", "fitness"] },
  { name: "Whoop",        iconSlug: "whoop",       iconColor: "0A0A0A", goalTypes: ["health", "fitness"] },
  { name: "Notion",       iconSlug: "notion",      iconColor: "000000", goalTypes: ["productivity"] },
  { name: "Todoist",      iconSlug: "todoist",     iconColor: "E44332", goalTypes: ["productivity"] },
  { name: "GitHub",       iconSlug: "github",      iconColor: "181717", goalTypes: ["productivity"] },
  { name: "RescueTime",   iconSlug: "rescuetime",  iconColor: "161A3B", goalTypes: ["productivity"] },
  { name: "Duolingo",     iconSlug: "duolingo",    iconColor: "58CC02", goalTypes: ["learning"] },
  { name: "Spotify",      iconSlug: "spotify",     iconColor: "1DB954", goalTypes: ["learning", "all"] },
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
                  background: isSelected ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.04)",
                  border: isSelected ? "none" : "0.5px solid rgba(0,0,0,0.07)",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getAppIconUrl(app.iconSlug, app.iconColor)}
                  width={24}
                  height={24}
                  alt={app.name}
                  style={{ display: "block", filter: isSelected ? "brightness(0) invert(1)" : "none" }}
                />
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
