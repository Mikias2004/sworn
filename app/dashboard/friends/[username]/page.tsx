"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";

type FriendProfile = {
  id: string;
  name: string;
  username: string;
  location?: string;
  active_goals_count: number;
  streak_count: number;
  hit_rate: number;
  friendship_status: "none" | "pending" | "accepted";
  goals: {
    id: string;
    title: string;
    frequency: string;
    streak_count: number;
    pledge_amount: number;
  }[];
};

function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const colors = ["#EAF3DE", "#FFF8EC", "#F0F4FF", "#FDF2F2", "#F5F0FF"];
  const textColors = ["#3B6D11", "#854F0B", "#1e40af", "#A32D2D", "#6B21A8"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: colors[idx], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.38, fontWeight: 600, color: textColors[idx] }}>
        {name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

export default function FriendProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState<"none" | "pending" | "accepted">("none");

  useEffect(() => {
    fetch(`/api/friends/profile/${username}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          setFollowStatus(d.profile.friendship_status);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowStatus("pending");
    await fetch("/api/friends/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: profile.id }),
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 40px", borderBottom: "0.5px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
          <Link href="/dashboard/friends" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>← Friends</Link>
        </header>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>User not found.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 40px", borderBottom: "0.5px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
        <Link href="/dashboard/friends" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>← Friends</Link>
        {followStatus === "accepted" ? (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "7px 14px", border: "0.5px solid var(--border)", borderRadius: 20 }}>Following</span>
        ) : followStatus === "pending" ? (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "7px 14px", border: "0.5px solid var(--border)", borderRadius: 20 }}>Requested</span>
        ) : (
          <button
            onClick={handleFollow}
            style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "var(--text-primary)", border: "none", padding: "8px 18px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit" }}
          >
            Follow
          </button>
        )}
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>
        {/* Profile header */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 32 }}>
          <Avatar name={profile.name || profile.username} size={64} />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>{profile.name}</h1>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: profile.location ? 2 : 0 }}>@{profile.username}</p>
            {profile.location && (
              <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{profile.location}</p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 32 }}>
          {[
            { label: "Active goals", value: profile.active_goals_count },
            { label: "Current streak", value: `${profile.streak_count}d` },
            { label: "Hit rate", value: `${profile.hit_rate}%` },
          ].map((stat) => (
            <div key={stat.label} style={{ border: "0.5px solid var(--border)", borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Active commitments */}
        {profile.goals.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
              Active commitments
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {profile.goals.map((goal) => (
                <div key={goal.id} style={{ border: "0.5px solid var(--border)", borderRadius: 12, padding: "16px", background: "var(--bg-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.4, marginRight: 12 }}>{goal.title}</p>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flexShrink: 0 }}>${goal.pledge_amount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: goal.streak_count > 0 ? "#854F0B" : "var(--text-tertiary)" }}>
                      {goal.streak_count > 0 ? `🔥 ${goal.streak_count} day streak` : goal.frequency}
                    </span>
                    <Link
                      href={`/onboarding/goal?preset=${goal.id}`}
                      style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", background: "var(--bg)", border: "0.5px solid var(--border-md)", padding: "5px 12px", borderRadius: 20, textDecoration: "none" }}
                    >
                      Do this goal too
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
