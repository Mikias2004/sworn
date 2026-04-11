"use client";

import Link from "next/link";
import { useState } from "react";
import type { Goal } from "@/lib/supabase";

const pledgeOptions = [5, 10, 30, 90, 270, 810];

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
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-primary)",
  marginBottom: 6,
};

type Props = {
  hasPaymentMethod: boolean;
  onClose: () => void;
  onCreated: (goal: Goal) => void;
};

export default function NewGoalModal({ hasPaymentMethod, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [metric, setMetric] = useState("");
  const [pledge, setPledge] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, frequency, metric, pledge_amount: pledge }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create goal.");
      setLoading(false);
      return;
    }

    onCreated(data.goal);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          maxWidth: 480,
          background: "var(--bg)",
          borderRadius: 16,
          border: "0.5px solid var(--border)",
          padding: 32,
          zIndex: 201,
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Set a new goal
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              color: "var(--text-tertiary)",
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* No payment method — block and prompt */}
        {!hasPaymentMethod ? (
          <div
            style={{
              background: "#FFF8EC",
              border: "0.5px solid rgba(181,130,40,0.3)",
              borderRadius: 10,
              padding: "20px 20px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#854F0B",
                marginBottom: 8,
              }}
            >
              You need a payment method first.
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#A0620E",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Goals need real stakes. Add a card and it will only be charged if
              you miss.
            </p>
            <Link
              href="/dashboard/add-payment"
              style={{
                display: "inline-block",
                fontSize: 14,
                fontWeight: 500,
                background: "var(--text-primary)",
                color: "#fff",
                padding: "10px 24px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Add a card →
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <div>
              <label htmlFor="title" style={labelStyle}>
                What&apos;s your goal?
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Hit the gym 4x per week"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="frequency" style={labelStyle}>
                  Frequency
                </label>
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="metric" style={labelStyle}>
                  Target metric
                </label>
                <input
                  id="metric"
                  type="text"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  placeholder="4 sessions"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Pledge amount</label>
              <div
                style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}
              >
                {pledgeOptions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPledge(p)}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border:
                        pledge === p
                          ? "0.5px solid var(--text-primary)"
                          : "0.5px solid var(--border-md)",
                      color: pledge === p ? "#fff" : "var(--text-secondary)",
                      background:
                        pledge === p
                          ? "var(--text-primary)"
                          : "var(--bg-secondary)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                  >
                    ${p}
                  </button>
                ))}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  marginTop: 10,
                  lineHeight: 1.5,
                }}
              >
                You&apos;ll only be charged ${pledge} if you miss this goal.
              </p>
            </div>

            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: "#A32D2D",
                  background: "#FDF2F2",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "0.5px solid rgba(163,45,45,0.2)",
                }}
              >
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--border-md)",
                  padding: "12px 0",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  fontSize: 14,
                  fontWeight: 500,
                  background: "var(--text-primary)",
                  color: "#fff",
                  padding: "12px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: loading ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.15s ease",
                }}
              >
                {loading ? "Creating…" : `Commit — $${pledge} on the line`}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
