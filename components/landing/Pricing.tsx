"use client";

import { useState } from "react";

const pledges = ["$5", "$10", "$30", "$90", "$270", "$810"];

export default function Pricing() {
  const [active, setActive] = useState("$5");

  return (
    <div
      id="pricing"
      style={{
        padding: "72px 40px",
        textAlign: "center",
        borderTop: "0.5px solid var(--border)",
      }}
      className="pricing-wrap"
    >
      <h2
        style={{
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          marginBottom: 10,
        }}
      >
        Free until you fail.
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          marginBottom: 40,
        }}
      >
        You only pay when you break your word. Stakes go up every time you miss,
        so you stay sharp.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        {pledges.map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            style={{
              fontSize: 13,
              fontWeight: 500,
              padding: "9px 18px",
              borderRadius: 8,
              border: active === p ? "0.5px solid var(--text-primary)" : "0.5px solid var(--border-md)",
              color: active === p ? "#fff" : "var(--text-secondary)",
              background: active === p ? "var(--text-primary)" : "var(--bg-secondary)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <p
        style={{
          fontSize: 13,
          color: "var(--text-tertiary)",
          maxWidth: 400,
          margin: "0 auto",
          lineHeight: 1.65,
        }}
      >
        Sworn only makes money when you slip up. So trust us, we want you to
        win.
      </p>

      <style>{`
        @media (max-width: 768px) {
          .pricing-wrap { padding: 56px 20px !important; }
        }
      `}</style>
    </div>
  );
}
