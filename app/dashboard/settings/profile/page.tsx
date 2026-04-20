"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import BottomNav from "@/components/dashboard/BottomNav";

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 14,
  color: "var(--text-primary)",
  background: "var(--bg)",
  border: "0.5px solid var(--border-md)",
  borderRadius: 8,
  padding: "11px 14px",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [success, setSuccess] = useState("");
  const [successPw, setSuccessPw] = useState("");
  const [error, setError] = useState("");
  const [errorPw, setErrorPw] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const d = await res.json();
        setName(d.name ?? "");
        setEmail(d.email ?? "");
        setUsername(d.username ?? "");
        setTimezone(d.timezone ?? "America/New_York");
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, timezone }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess("Profile saved.");
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to save.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPw(true);
    setErrorPw("");
    setSuccessPw("");
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSavingPw(false);
    if (res.ok) {
      setSuccessPw("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      const d = await res.json();
      setErrorPw(d.error ?? "Failed to update password.");
    }
  };

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "Pacific/Honolulu",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney",
  ];

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
          Profile
        </h1>

        {/* Profile form */}
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={{ ...inputStyle, background: "var(--bg-secondary)", color: "var(--text-tertiary)" }} value={email} disabled placeholder="email@example.com" />
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>Email cannot be changed. Contact support if needed.</p>
          </div>
          <div>
            <label style={labelStyle}>Username</label>
            <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="username" />
          </div>
          <div>
            <label style={labelStyle}>Time zone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {success && (
            <p style={{ fontSize: 13, color: "#2D7A4A", background: "#F2FDF5", padding: "10px 14px", borderRadius: 8, border: "0.5px solid rgba(45,122,74,0.2)" }}>
              {success}
            </p>
          )}
          {error && (
            <p style={{ fontSize: 13, color: "#A32D2D", background: "#FDF2F2", padding: "10px 14px", borderRadius: 8, border: "0.5px solid rgba(163,45,45,0.2)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{ fontSize: 14, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "12px 0", borderRadius: 8, border: "none", cursor: saving ? "default" : "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>

        {/* Password change */}
        <div style={{ paddingTop: 28, borderTop: "0.5px solid var(--border)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>Change password</h2>
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Current password</label>
              <input type="password" style={inputStyle} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
            </div>
            <div>
              <label style={labelStyle}>New password</label>
              <input type="password" style={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" minLength={8} />
            </div>

            {successPw && (
              <p style={{ fontSize: 13, color: "#2D7A4A", background: "#F2FDF5", padding: "10px 14px", borderRadius: 8, border: "0.5px solid rgba(45,122,74,0.2)" }}>
                {successPw}
              </p>
            )}
            {errorPw && (
              <p style={{ fontSize: 13, color: "#A32D2D", background: "#FDF2F2", padding: "10px 14px", borderRadius: 8, border: "0.5px solid rgba(163,45,45,0.2)" }}>
                {errorPw}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPw || !currentPassword || !newPassword}
              style={{ fontSize: 14, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "12px 0", borderRadius: 8, border: "none", cursor: (savingPw || !currentPassword || !newPassword) ? "default" : "pointer", fontFamily: "inherit", opacity: (savingPw || !currentPassword || !newPassword) ? 0.5 : 1 }}
            >
              {savingPw ? "Updating…" : "Update password"}
            </button>
          </form>
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
