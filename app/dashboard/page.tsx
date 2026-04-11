"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Goal } from "@/lib/supabase";
import NewGoalModal from "./NewGoalModal";

const statusDot: Record<string, string> = {
  active: "#3B6D11",
  completed: "#185FA5",
  failed: "#A32D2D",
  archived: "#888780",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  failed: "Failed",
  archived: "Archived",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchGoals();
      checkPaymentMethod();
    }
  }, [status]);

  const fetchGoals = async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    if (res.ok) {
      const data = await res.json();
      setGoals(data.goals ?? []);
    }
    setLoading(false);
  };

  const checkPaymentMethod = async () => {
    const res = await fetch("/api/user/payment-status");
    if (res.ok) {
      const data = await res.json();
      setHasPaymentMethod(data.hasPaymentMethod);
    }
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const activeGoals = goals.filter((g) => g.status === "active");

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
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

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {session?.user?.name && (
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              {session.user.name}
            </span>
          )}
          <button
            onClick={() => setShowModal(true)}
            style={{
              fontSize: 13,
              fontWeight: 500,
              background: "var(--text-primary)",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + New goal
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* No payment method banner */}
      {hasPaymentMethod === false && (
        <div
          style={{
            background: "#FFF8EC",
            borderBottom: "0.5px solid rgba(181,130,40,0.25)",
            padding: "12px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 13, color: "#854F0B" }}>
            Add a payment method before setting a goal — it&apos;s what makes
            the commitment real.
          </p>
          <Link
            href="/dashboard/add-payment"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#854F0B",
              background: "rgba(181,130,40,0.12)",
              border: "0.5px solid rgba(181,130,40,0.3)",
              padding: "6px 14px",
              borderRadius: 8,
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Add card →
          </Link>
        </div>
      )}

      {/* Content */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Your goals
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {activeGoals.length} active{" "}
            {activeGoals.length === 1 ? "goal" : "goals"}
          </p>
        </div>

        {goals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 20px" }}>
            <p
              style={{
                fontSize: 15,
                color: "var(--text-secondary)",
                marginBottom: 8,
              }}
            >
              No goals yet.
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-tertiary)",
                marginBottom: 28,
              }}
            >
              Set your first goal and put something on the line.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                fontSize: 14,
                fontWeight: 500,
                background: "var(--text-primary)",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Set your first goal
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {goals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border)",
                  borderRadius: 12,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: statusDot[goal.status] ?? "#888",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      {goal.title}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      {goal.frequency} · {goal.metric} · {statusLabel[goal.status]}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    ${goal.pledge_amount}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      border: "0.5px solid var(--border)",
                      borderRadius: 99,
                      padding: "2px 10px",
                      background: "#fff",
                    }}
                  >
                    on the line
                  </span>
                  {goal.status === "active" && (
                    <button
                      onClick={() => handleArchive(goal.id)}
                      title="Archive goal"
                      style={{
                        fontSize: 11,
                        color: "var(--text-tertiary)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 8px",
                        fontFamily: "inherit",
                      }}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewGoalModal
          hasPaymentMethod={hasPaymentMethod === true}
          onClose={() => setShowModal(false)}
          onCreated={(goal) => {
            setGoals((prev) => [goal, ...prev]);
            setShowModal(false);
          }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          header { padding: 14px 20px !important; }
          main { padding: 32px 20px !important; }
        }
      `}</style>
    </div>
  );
}
