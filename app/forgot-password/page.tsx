"use client";

import Link from "next/link";
import { useState } from "react";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      setStatus("error");
      return;
    }

    setStatus("success");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        background: "var(--bg)",
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
          marginBottom: 48,
        }}
      >
        Sworn.
      </Link>

      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Reset your password
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginBottom: 32,
          }}
        >
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {status === "success" ? (
          <div
            style={{
              fontSize: 14,
              color: "#2D7A4A",
              background: "#F2FDF5",
              padding: "16px 18px",
              borderRadius: 8,
              border: "0.5px solid rgba(45,122,74,0.2)",
              lineHeight: 1.6,
            }}
          >
            Check your inbox — we sent a reset link to <strong>{email}</strong>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label htmlFor="email" style={labelStyle}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
              />
            </div>

            {status === "error" && (
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
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                fontSize: 14,
                fontWeight: 500,
                background: "var(--text-primary)",
                color: "#fff",
                padding: "12px 0",
                borderRadius: 8,
                border: "none",
                cursor: status === "loading" ? "default" : "pointer",
                fontFamily: "inherit",
                marginTop: 4,
                opacity: status === "loading" ? 0.6 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              {status === "loading" ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            textAlign: "center",
            marginTop: 24,
          }}
        >
          <Link
            href="/login"
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
