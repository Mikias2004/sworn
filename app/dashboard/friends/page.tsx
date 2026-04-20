"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import BottomNav from "@/components/dashboard/BottomNav";

type Friend = {
  id: string;
  username: string;
  name: string;
  active_goals_count: number;
  streak_count: number;
  friendship_status: "none" | "pending" | "accepted";
};

type FeedItem = {
  id: string;
  friend_name: string;
  friend_username: string;
  action: "logged" | "new_goal" | "missed";
  goal_title: string;
  created_at: string;
  streak_count?: number;
  pledge_amount?: number;
  goal_id?: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
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

function FollowButton({ status, onFollow }: { status: "none" | "pending" | "accepted"; onFollow: () => void }) {
  if (status === "accepted") {
    return (
      <span style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "7px 14px", border: "0.5px solid var(--border)", borderRadius: 20 }}>
        Following
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "7px 14px", border: "0.5px solid var(--border)", borderRadius: 20 }}>
        Requested
      </span>
    );
  }
  return (
    <button
      onClick={onFollow}
      style={{ fontSize: 12, fontWeight: 500, color: "#fff", background: "var(--text-primary)", border: "none", padding: "7px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit" }}
    >
      Follow
    </button>
  );
}

export default function FriendsPage() {
  const { data: session } = useSession();
  const [contactsPermission, setContactsPermission] = useState<"unknown" | "skipped" | "granted">("unknown");
  const [comingSoonModal, setComingSoonModal] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggested, setSuggested] = useState<Friend[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, "none" | "pending" | "accepted">>({});
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sworn_contacts_permission");
    if (stored) setContactsPermission(stored as "skipped" | "granted");

    fetch("/api/friends/feed")
      .then((r) => r.json())
      .then((d) => {
        setFeed(d.feed ?? []);
        setSuggested(d.suggested ?? []);
        const statuses: Record<string, "none" | "pending" | "accepted"> = {};
        for (const u of (d.suggested ?? [])) statuses[u.id] = u.friendship_status;
        setFriendStatuses(statuses);
        setLoadingFeed(false);
      })
      .catch(() => setLoadingFeed(false));

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => setReferralCode(d.username ?? ""));
  }, []);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const d = await res.json();
      const results = d.users ?? [];
      setSearchResults(results);
      const statuses: Record<string, "none" | "pending" | "accepted"> = { ...friendStatuses };
      for (const u of results) statuses[u.id] = u.friendship_status;
      setFriendStatuses(statuses);
    }
    setSearching(false);
  };

  const handleFollow = async (userId: string) => {
    setFriendStatuses((prev) => ({ ...prev, [userId]: "pending" }));
    await fetch("/api/friends/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: userId }),
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://sworn.app/signup?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectContacts = () => setComingSoonModal(true);
  const handleSkip = () => {
    localStorage.setItem("sworn_contacts_permission", "skipped");
    setContactsPermission("skipped");
  };

  const displayList = search.trim() ? searchResults : suggested;

  // Contacts permission screen
  if (contactsPermission === "unknown") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 40px", borderBottom: "0.5px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
          <Link href="/" style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", textDecoration: "none" }}>Sworn.</Link>
        </header>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
          {/* Icon */}
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--bg-secondary)", border: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 10 }}>
            Find friends on Sworn.
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 32 }}>
            Commitments are easier when someone else is watching. See which of your friends are already on Sworn.
          </p>

          {/* Reasons */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
            {[
              "We only match phone numbers and emails. Nothing else.",
              "Your contacts never see this data. We don't store it.",
              "We will never message or email your contacts.",
            ].map((text) => (
              <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 11, color: "#3B6D11", fontWeight: 700 }}>✓</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleConnectContacts}
            style={{ width: "100%", fontSize: 15, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "14px 0", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}
          >
            Connect contacts
          </button>
          <button
            onClick={handleSkip}
            style={{ fontSize: 13, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            Skip — add friends manually
          </button>
        </div>

        {/* Coming soon modal */}
        {comingSoonModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 24 }}>
            <div style={{ background: "var(--bg)", borderRadius: 16, padding: "32px 28px", maxWidth: 380, width: "100%", textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", marginBottom: 10 }}>Coming soon</p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
                Contacts sync is coming in the next update. For now, add friends by username.
              </p>
              <button
                onClick={() => { setComingSoonModal(false); handleSkip(); }}
                style={{ width: "100%", fontSize: 14, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "12px 0", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Add friends by username
              </button>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    );
  }

  // Main friends page
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 40px", borderBottom: "0.5px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", letterSpacing: "-0.02em", textDecoration: "none" }}>Sworn.</Link>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: 4 }}>Friends</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            {contactsPermission === "granted" ? "Some of your contacts are on Sworn" : "Find friends by username"}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 28 }}>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by username"
            style={{ width: "100%", fontSize: 14, color: "var(--text-primary)", background: "var(--bg-secondary)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "11px 14px 11px 40px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searching && <p style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-tertiary)" }}>…</p>}
        </div>

        {/* Friends list */}
        {displayList.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
              {search.trim() ? "Search results" : "Suggested"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {displayList.map((user, i) => (
                <div key={user.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--bg)", borderTop: i > 0 ? "0.5px solid var(--border)" : "none" }}>
                  <Link href={`/dashboard/friends/${user.username}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <Avatar name={user.name || user.username} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                      <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>@{user.username} · {user.active_goals_count} active goals</p>
                    </div>
                  </Link>
                  <FollowButton
                    status={friendStatuses[user.id] ?? "none"}
                    onFollow={() => handleFollow(user.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        {!search.trim() && (
          <>
            {feed.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Activity</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {feed.map((item) => (
                    <div key={item.id} style={{ border: "0.5px solid var(--border)", borderRadius: 12, padding: "16px", background: "var(--bg-secondary)" }}>
                      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <Avatar name={item.friend_name} size={32} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                            <Link href={`/dashboard/friends/${item.friend_username}`} style={{ textDecoration: "none", color: "inherit" }}>{item.friend_name}</Link>
                          </p>
                          <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{timeAgo(item.created_at)}</p>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 18 }}>
                          {item.action === "logged" ? "✓" : item.action === "new_goal" ? "🎯" : "💸"}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>
                        {item.action === "logged" && "Logged a session"}
                        {item.action === "new_goal" && "Started a new goal"}
                        {item.action === "missed" && "Missed a goal"}
                        {" — "}<span style={{ fontStyle: "italic" }}>{item.goal_title}</span>
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {item.streak_count && item.streak_count > 0 ? (
                          <span style={{ fontSize: 11, color: "#854F0B", background: "#FFF8EC", border: "0.5px solid rgba(133,79,11,0.2)", padding: "3px 10px", borderRadius: 20 }}>🔥 {item.streak_count} day streak</span>
                        ) : null}
                        {item.pledge_amount ? (
                          <span style={{ fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg)", border: "0.5px solid var(--border)", padding: "3px 10px", borderRadius: 20 }}>${item.pledge_amount} stake</span>
                        ) : null}
                        {item.goal_id && (
                          <Link
                            href={`/onboarding/goal?preset=${item.goal_id}`}
                            style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500, color: "var(--text-primary)", background: "var(--bg)", border: "0.5px solid var(--border-md)", padding: "4px 12px", borderRadius: 20, textDecoration: "none" }}
                          >
                            Do this goal
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite section */}
            {feed.length === 0 && !loadingFeed && (
              <div style={{ border: "0.5px solid var(--border)", borderRadius: 14, padding: "28px 20px", textAlign: "center", marginBottom: 28 }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>Invite your friends</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                  Accountability is more powerful with people you know. Share your link to get them started.
                </p>
                {referralCode && (
                  <div style={{ background: "var(--bg-secondary)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      sworn.app/signup?ref={referralCode}
                    </span>
                    <button
                      onClick={handleCopyLink}
                      style={{ fontSize: 12, fontWeight: 500, color: copied ? "#2D7A4A" : "var(--text-primary)", background: "var(--bg)", border: "0.5px solid var(--border)", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      {copied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                )}
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={() => navigator.share({ title: "Join me on Sworn", text: "I'm using Sworn to stick to my goals. Join me!", url: `https://sworn.app/signup?ref=${referralCode}` })}
                    style={{ width: "100%", fontSize: 14, fontWeight: 500, background: "var(--text-primary)", color: "#fff", padding: "12px 0", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Share invite
                  </button>
                )}
              </div>
            )}
          </>
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
