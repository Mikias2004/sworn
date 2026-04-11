const messages = [
  { from: "user", text: "I want to hit the gym 4 times a week" },
  {
    from: "ai",
    text: "Got it. I can pull your workouts straight from Apple Health. Want to start with $10 on the line?",
  },
  { from: "user", text: "Yes, let's go" },
  {
    from: "ai",
    text: "You're live. Goal kicks off Monday. $10 is on the line. Don't skip leg day.",
  },
];

export default function AISetup() {
  return (
    <div
      style={{
        display: "flex",
        gap: 56,
        alignItems: "center",
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
        padding: "72px 40px",
      }}
      className="ai-strip"
    >
      <div style={{ flex: 1 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            color: "#3B6D11",
            background: "#EAF3DE",
            borderRadius: 99,
            padding: "3px 12px",
            marginBottom: 16,
          }}
        >
          Smart setup
        </span>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 14,
            lineHeight: 1.25,
          }}
        >
          Live in two minutes,
          <br />
          not two hours.
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.75,
          }}
        >
          Just tell Sworn what you want. It figures out which apps to connect,
          sets up your tracking, and gets you going fast. No manuals, no Zapier,
          no headache. If it gets complicated, a real person jumps in to sort it
          out.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          background: "var(--bg-secondary)",
          borderRadius: 16,
          border: "0.5px solid var(--border)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.from === "user" ? "flex-end" : "flex-start",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-tertiary)",
                  marginBottom: 3,
                }}
              >
                {m.from === "user" ? "You" : "Sworn"}
              </p>
              <div
                style={{
                  fontSize: 13,
                  padding: "11px 15px",
                  borderRadius: 12,
                  maxWidth: "86%",
                  lineHeight: 1.55,
                  background:
                    m.from === "user" ? "var(--text-primary)" : "#fff",
                  color: m.from === "user" ? "#fff" : "var(--text-primary)",
                  border:
                    m.from === "ai" ? "0.5px solid var(--border)" : "none",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ai-strip { flex-direction: column !important; padding: 48px 20px !important; }
        }
      `}</style>
    </div>
  );
}
