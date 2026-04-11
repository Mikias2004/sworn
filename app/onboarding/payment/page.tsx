"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getOnboarding } from "@/lib/onboarding";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function SetupForm({ pledgeAmount }: { pledgeAmount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setLoading(true);

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/onboarding/confirm`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/onboarding/confirm"), 800);
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>
          Card saved.
        </p>
        <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
          Setting up your commitment…
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
        <PaymentElement options={{ layout: "tabs" }} />
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
          fontSize: 15,
          fontWeight: 500,
          background: "var(--text-primary)",
          color: "#fff",
          padding: "14px 0",
          borderRadius: 10,
          border: "none",
          cursor: !stripe || loading ? "default" : "pointer",
          fontFamily: "inherit",
          opacity: !stripe || loading ? 0.6 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {loading ? "Saving…" : `Add card and go live →`}
      </button>

      <p
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          textAlign: "center",
          marginTop: 14,
          lineHeight: 1.55,
        }}
      >
        Secured by Stripe. Your card details never touch our servers.
        <br />
        You won&apos;t be charged today — only if you miss your goal.
      </p>
    </form>
  );
}

export default function OnboardingPaymentPage() {
  const { status } = useSession();
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState(10);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    const state = getOnboarding();
    if (!state.trackingApp && state.trackingApp !== null) {
      // trackingApp must have been set (even if null = manual)
      // Only redirect if the key is truly absent
      if (!("trackingApp" in state)) {
        router.replace("/onboarding/connect");
        return;
      }
    }
    if (state.pledgeAmount) setPledgeAmount(state.pledgeAmount);

    if (status === "authenticated") {
      fetch("/api/stripe/setup-intent", { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          if (d.clientSecret) setClientSecret(d.clientSecret);
          else setFetchError(d.error ?? "Failed to start payment setup.");
        })
        .catch(() => setFetchError("Failed to reach server."));
    }
  }, [status]);

  if (status === "loading") return null;

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "52px 24px 40px" }}>
      <p style={{ fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Step 5 of 5
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 10 }}>
        Add your payment method.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
        You won&apos;t be charged today. Only if you miss your goal.
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

      {!clientSecret && !fetchError ? (
        <p style={{ fontSize: 14, color: "var(--text-tertiary)" }}>Loading…</p>
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
          <SetupForm pledgeAmount={pledgeAmount} />
        </Elements>
      ) : null}
    </main>
  );
}
