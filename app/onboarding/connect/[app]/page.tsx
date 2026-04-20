"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { setOnboarding, getOnboarding } from "@/lib/onboarding";
import { getAppBySlug } from "@/lib/apps";

function ConnectAppInner() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.app as string;

  const [authorizing, setAuthorizing] = useState(false);
  const [done, setDone] = useState(false);

  const app = getAppBySlug(slug);
  const next = searchParams.get("next") ?? "/onboarding/stake";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    const s = getOnboarding();
    if (!s.title) { router.replace("/onboarding/goal"); return; }
    if (!app) { router.replace("/onboarding/goal"); return; }
  }, [status, app]);

  const handleAuthorize = async () => {
    if (!app) return;
    setAuthorizing(true);

    // MVP: simulate OAuth — save preference, 1.5s loading, proceed
    await new Promise((r) => setTimeout(r, 1500));

    setOnboarding({
      trackingApp: app.name,
      recommendedTrackingMethod: "connected",
    });

    setDone(true);
    setTimeout(() => router.push(next), 300);
  };

  if (status === "loading" || !app) return null;

  const permissions = [
    "Read your activity history",
    app.permission2,
    app.permission3,
  ];

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "52px 24px 60px" }}>
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "0.5px solid var(--border)",
          borderRadius: 16,
          padding: "36px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: app.bg,
            color: app.color,
            border: app.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            margin: "0 auto 20px",
            flexShrink: 0,
          }}
        >
          {app.letter}
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Connect to {app.name}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          Sworn will read your {app.activity} to verify your progress. We never
          post or modify anything.
        </p>

        <div
          style={{
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {permissions.map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#EAF3DE",
                  border: "0.5px solid rgba(59,109,17,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <span style={{ fontSize: 9, color: "#3B6D11", fontWeight: 700 }}>✓</span>
              </div>
              <span style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
                {p}
              </span>
            </div>
          ))}
        </div>

        <div style={{ height: "0.5px", background: "var(--border)", margin: "0 0 24px" }} />

        <button
          onClick={handleAuthorize}
          disabled={authorizing || done}
          style={{
            width: "100%",
            fontSize: 15,
            fontWeight: 500,
            background: authorizing || done ? "#3B6D11" : "var(--text-primary)",
            color: "#fff",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            cursor: authorizing || done ? "default" : "pointer",
            fontFamily: "inherit",
            transition: "background 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {done ? (
            <>
              <span style={{ fontSize: 14 }}>✓</span> Connected
            </>
          ) : authorizing ? (
            <span style={{ opacity: 0.8 }}>Connecting…</span>
          ) : (
            `Authorize ${app.name} →`
          )}
        </button>

        <p
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            marginTop: 12,
            lineHeight: 1.5,
          }}
        >
          Read only. We never post to {app.name} or access your personal data.
        </p>
      </div>

      <button
        onClick={() => router.back()}
        style={{
          display: "block",
          width: "100%",
          marginTop: 14,
          fontSize: 13,
          color: "var(--text-tertiary)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "center",
        }}
      >
        ← Go back
      </button>
    </main>
  );
}

export default function ConnectAppPage() {
  return (
    <Suspense fallback={null}>
      <ConnectAppInner />
    </Suspense>
  );
}
