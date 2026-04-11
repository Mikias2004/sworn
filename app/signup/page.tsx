"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1. Create the account
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    // 2. Sign in automatically after account creation
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Account created but sign-in failed. Please log in.");
      router.push("/login");
      return;
    }

    router.push("/onboarding/goal");
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
          Create your account
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginBottom: 32,
          }}
        >
          Start for free. Pay nothing unless you miss a goal.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label htmlFor="name" style={labelStyle}>
              Name <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />
          </div>

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

          <div>
            <label htmlFor="password" style={labelStyle}>
              Password
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              fontSize: 14,
              fontWeight: 500,
              background: "var(--text-primary)",
              color: "#fff",
              padding: "12px 0",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
              marginTop: 4,
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
