"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Who gets my money if I fail?",
    a: "Sworn does. We keep the charge when you miss a goal. That's the honest answer. It's also why we have zero interest in making goals easy to fail — we'd rather you win and stay with us long term.",
    defaultOpen: true,
  },
  {
    q: "What if something genuine comes up?",
    a: "Life happens. If you have a real emergency, reach out before your deadline and we'll work something out. We're not here to punish bad luck — we're here to stop you from making excuses.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Archive any goal at any time and you're off the hook after a one week wind-down period. That window exists so you can't bail the moment things get hard. Fair warning.",
  },
  {
    q: "What if the app tracks something wrong?",
    a: "If a tracking error causes a charge, we fix it. Just contact us within 24 hours of the charge with what happened. We check every dispute and we've never once refused a legitimate one.",
  },
  {
    q: "How is this different from just using a habit app?",
    a: "Habit apps rely on motivation. Sworn relies on stakes. Motivation fades. Losing $90 does not. That's the whole difference and it's why people who've tried everything else stick with Sworn.",
  },
  {
    q: "Is my payment information safe?",
    a: "Your card details never touch our servers. All payments are handled by Stripe, the same infrastructure used by Amazon, Google, and most major apps you already trust.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
        padding: "72px 40px",
      }}
      className="faq-wrap"
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Questions people actually ask.
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          The money part is new for most people. Here&apos;s how it works.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 8,
                border: "0.5px solid var(--border)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggle(i)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: "18px 22px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "inherit",
                }}
              >
                {faq.q}
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    flexShrink: 0,
                    marginLeft: 12,
                    display: "inline-block",
                    transition: "transform 0.2s ease",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▲
                </span>
              </button>
              {isOpen && (
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    lineHeight: 1.75,
                    padding: "0 22px 18px",
                  }}
                >
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .faq-wrap { padding: 56px 20px !important; }
        }
      `}</style>
    </div>
  );
}
