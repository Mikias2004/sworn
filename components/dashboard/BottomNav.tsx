"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  match: (path: string) => boolean;
};

function GoalsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#0d0d0d" : "#999"} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function FriendsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#0d0d0d" : "#999"} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#0d0d0d" : "#999"} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#0d0d0d" : "#999"} strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  const tabs: Tab[] = [
    {
      href: "/dashboard",
      label: "Goals",
      icon: (active: boolean) => <GoalsIcon active={active} />,
      match: (p) => p === "/dashboard" || p.startsWith("/dashboard/goals"),
    },
    {
      href: "/dashboard/friends",
      label: "Friends",
      icon: (active: boolean) => <FriendsIcon active={active} />,
      match: (p) => p.startsWith("/dashboard/friends"),
    },
    {
      href: "/dashboard/discover",
      label: "Discover",
      icon: (active: boolean) => <DiscoverIcon active={active} />,
      match: (p) => p.startsWith("/dashboard/discover"),
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: (active: boolean) => <SettingsIcon active={active} />,
      match: (p) => p.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <>
      {/* Spacer so content isn't hidden under the tab bar */}
      <div style={{ height: 68 }} />
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: "var(--bg)",
          borderTop: "0.5px solid var(--border)",
          display: "flex",
          alignItems: "stretch",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "10px 0",
                textDecoration: "none",
                color: active ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              {tab.icon(active)}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: "0.01em",
                  color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
