"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

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

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!token) {
    return (
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
        Invalid reset link. Please{" "}
        <Link
          href="/forgot-password"
          style={{ color: "#A32D2D", fontWeight: 500 }}
        >
          request a new one
        </Link>
        .
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirm) {
      setErrorMsg("Passwords don't match.");
      setStatus("error");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      setStatus("error");
      return;
    }

    router.push("/login?success=password-updated");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div>
        <label htmlFor="password" style={labelStyle}>
          New password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          required
          minLength={8}
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="confirm" style={labelStyle}>
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your new password"
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
        {status === "loading" ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
          Choose a new password
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginBottom: 32,
          }}
        >
          Enter your new password below.
        </p>

        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>

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
