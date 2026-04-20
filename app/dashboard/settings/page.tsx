"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import BottomNav from "@/components/dashboard/BottomNav";

type SettingRow = { label: string; desc: string; href: string };

const sections: { title: string; rows: SettingRow[] }[] = [
  {
    title: "Account",
    rows: [
      { label: "Profile", desc: "Name, email, username, password, time zone", href: "/dashboard/settings/profile" },
      { label: "Notifications", desc: "Check-in times, types, quiet hours", href: "/dashboard/settings/notifications" },
    ],
  },
  {
    title: "Payment",
    rows: [
      { label: "Payment method", desc: "Manage your card on file", href: "/dashboard/settings/payment" },
      { label: "Billing history", desc: "All charges and refunds", href: "/dashboard/settings/billing" },
    ],
  },
  {
    title: "Goals",
    rows: [
      { label: "Archived goals", desc: "View, restore, or delete past commitments", href: "/dashboard/settings/archived" },
    ],
  },
  {
    title: "Privacy",
    rows: [
      { label: "Privacy & data", desc: "Export, connected apps, delete account", href: "/dashboard/settings/privacy" },
    ],
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 40px",
          borderBottom: "0.5px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 100,
        }}
      >
        <Link href="/" style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", textDecoration: "none" }}>
          Sworn.
        </Link>
        {session?.user?.name && (
          <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{session.user.name}</span>
        )}
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 32 }}>
          Settings
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {sections.map((section) => (
            <div key={section.title}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                {section.title}
              </p>
              <div
                style={{
                  border: "0.5px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {section.rows.map((row, i) => (
                  <Link
                    key={row.href}
                    href={row.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 18px",
                      textDecoration: "none",
                      background: "var(--bg)",
                      borderTop: i > 0 ? "0.5px solid var(--border)" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg)")}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>{row.label}</p>
                      <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{row.desc}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, paddingTop: 28, borderTop: "0.5px solid var(--border)" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ fontSize: 14, color: "#A32D2D", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
          >
            Log out
          </button>
        </div>
      </main>

      <BottomNav />

      <style>{`
        @media (max-width: 768px) {
          header { padding: 14px 20px !important; }
        }
      `}</style>
    </div>
  );
}
