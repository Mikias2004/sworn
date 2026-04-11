"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Inner form — must live inside <Elements>
function SetupForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError("");
    setLoading(true);

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setSucceeded(true);
    // Give the webhook a moment to fire before redirecting
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  if (succeeded) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          Card saved.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          Taking you back to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "0.5px solid var(--border)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <PaymentElement
          options={{
            layout: "tabs",
          }}
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
            marginBottom: 16,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: "100%",
          fontSize: 14,
          fontWeight: 500,
          background: "var(--text-primary)",
          color: "#fff",
          padding: "12px 0",
          borderRadius: 8,
          border: "none",
          cursor: !stripe || loading ? "default" : "pointer",
          fontFamily: "inherit",
          opacity: !stripe || loading ? 0.6 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {loading ? "Saving…" : "Save card"}
      </button>
    </form>
  );
}

// Outer page — fetches SetupIntent client secret, then renders Elements
export default function AddPaymentPage() {
  const { status } = useSession();
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/stripe/setup-intent", { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          if (d.clientSecret) setClientSecret(d.clientSecret);
          else setFetchError(d.error ?? "Failed to initialise payment setup.");
        })
        .catch(() => setFetchError("Failed to reach server."));
    }
  }, [status]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 40px",
          borderBottom: "0.5px solid var(--border)",
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
        <Link
          href="/dashboard"
          style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}
        >
          ← Back to dashboard
        </Link>
      </header>

      <main
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "56px 40px",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Add a payment method
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginBottom: 32,
            lineHeight: 1.65,
          }}
        >
          Your card is only charged if you miss a goal. We use Stripe — your
          details never touch our servers.
        </p>

        {fetchError && (
          <p
            style={{
              fontSize: 13,
              color: "#A32D2D",
              background: "#FDF2F2",
              padding: "10px 14px",
              borderRadius: 8,
              border: "0.5px solid rgba(163,45,45,0.2)",
              marginBottom: 20,
            }}
          >
            {fetchError}
          </p>
        )}

        {status === "loading" || (!clientSecret && !fetchError) ? (
          <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>
            Loading…
          </p>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#0d0d0d",
                  colorBackground: "#ffffff",
                  colorText: "#0d0d0d",
                  colorDanger: "#A32D2D",
                  fontFamily: "Inter, sans-serif",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <SetupForm />
          </Elements>
        ) : null}

        <p
          style={{
            fontSize: 12,
            color: "var(--text-tertiary)",
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          Secured by Stripe. We store only a token — never your raw card
          details.
        </p>
      </main>
    </div>
  );
}
