"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNav from "@/components/dashboard/BottomNav";

type NotifPrefs = {
  time_morning: string;
  time_midday: string;
  time_deadline: string;
  streak_celebrations: boolean;
  miss_notifications: boolean;
  weekly_summary: boolean;
  friends_activity: boolean;
  quiet_hours_enabled: boolean;
  quiet_from: string;
  quiet_to: string;
};

const defaults: NotifPrefs = {
  time_morning: "08:00",
  time_midday: "12:00",
  time_deadline: "22:00",
  streak_celebrations: true,
  miss_notifications: true,
  weekly_summary: true,
  friends_activity: false,
  quiet_hours_enabled: false,
  quiet_from: "22:00",
  quiet_to: "07:00",
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? "#0d0d0d" : "var(--border-md)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "0.5px solid var(--border)" }}>
      <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 14,
          color: "var(--text-primary)",
          background: "var(--bg-secondary)",
          border: "0.5px solid var(--border)",
          borderRadius: 8,
          padding: "6px 10px",
          fontFamily: "inherit",
          outline: "none",
        }}
      />
    </div>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "0.5px solid var(--border)" }}>
      <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{label}</span>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(defaults);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/user/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (d.prefs) setPrefs({ ...defaults, ...d.prefs });
      });
  }, []);

  const set = <K extends keyof NotifPrefs>(key: K, val: NotifPrefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    await fetch("/api/user/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 40px",
          borderBottom: "0.5px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 100,
        }}
      >
        <Link href="/dashboard/settings" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
          ← Settings
        </Link>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 32 }}>
          Notifications
        </h1>

        {/* Daily check-ins */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>
            Daily check-ins
          </p>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>Times when Sworn will nudge you to log your session.</p>
          <TimeInput label="Morning kickoff" value={prefs.time_morning} onChange={(v) => set("time_morning", v)} />
          <TimeInput label="Midday check" value={prefs.time_midday} onChange={(v) => set("time_midday", v)} />
          <TimeInput label="Danger zone" value={prefs.time_deadline} onChange={(v) => set("time_deadline", v)} />
        </div>

        {/* Types */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>
            Types
          </p>
          <ToggleRow label="Streak celebrations" on={prefs.streak_celebrations} onChange={(v) => set("streak_celebrations", v)} />
          <ToggleRow label="Miss notifications" on={prefs.miss_notifications} onChange={(v) => set("miss_notifications", v)} />
          <ToggleRow label="Weekly summary" on={prefs.weekly_summary} onChange={(v) => set("weekly_summary", v)} />
          <ToggleRow label="Friends activity" on={prefs.friends_activity} onChange={(v) => set("friends_activity", v)} />
        </div>

        {/* Quiet hours */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>
            Quiet hours
          </p>
          <ToggleRow label="Enable quiet hours" on={prefs.quiet_hours_enabled} onChange={(v) => set("quiet_hours_enabled", v)} />
          {prefs.quiet_hours_enabled && (
            <>
              <TimeInput label="From" value={prefs.quiet_from} onChange={(v) => set("quiet_from", v)} />
              <TimeInput label="To" value={prefs.quiet_to} onChange={(v) => set("quiet_to", v)} />
            </>
          )}
        </div>

        {success && (
          <p style={{ fontSize: 13, color: "#2D7A4A", background: "#F2FDF5", padding: "10px 14px", borderRadius: 8, border: "0.5px solid rgba(45,122,74,0.2)", marginBottom: 16 }}>
            Saved.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: "100%", fontSize: 14, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "13px 0", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
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
