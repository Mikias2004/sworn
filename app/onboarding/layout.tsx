import Link from "next/link";
import OnboardingProgress from "./OnboardingProgress";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Top bar: logo + progress */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          borderBottom: "0.5px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 24px",
          }}
        >
          <Link
            href="/"
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
        </div>
        <OnboardingProgress />
      </div>

      {children}
    </div>
  );
}
