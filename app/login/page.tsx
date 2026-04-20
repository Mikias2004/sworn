"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const successParam = searchParams.get("success");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
  };

  return (
    <>
      {successParam === "password-updated" && (
        <p
          style={{
            fontSize: 13,
            color: "#2D7A4A",
            background: "#F2FDF5",
            padding: "10px 14px",
            borderRadius: 8,
            border: "0.5px solid rgba(45,122,74,0.2)",
            marginBottom: 16,
          }}
        >
          Password updated. Sign in with your new password.
        </p>
      )}

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

        <div>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            style={inputStyle}
          />
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 8,
            }}
          >
            <Link
              href="/forgot-password"
              style={{
                fontSize: 12,
                color: "var(--text-tertiary)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "var(--text-secondary)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "var(--text-tertiary)")
              }
            >
              Forgot password?
            </Link>
            <Link
              href="/forgot-username"
              style={{
                fontSize: 12,
                color: "var(--text-tertiary)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "var(--text-secondary)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "var(--text-tertiary)")
              }
            >
              Forgot username?
            </Link>
          </div>
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
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
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
          Welcome back
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginBottom: 32,
          }}
        >
          Log in to check on your goals.
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
