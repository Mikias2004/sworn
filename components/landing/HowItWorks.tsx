const steps = [
  {
    num: "01",
    title: "Tell us your goal",
    body: "Type it out in plain English. Setup takes under two minutes and connects to the apps you already use.",
  },
  {
    num: "02",
    title: "Decide what's at stake",
    body: "You pick the amount. Start at $5 or go higher if you mean serious business. Miss the goal and that money is gone.",
  },
  {
    num: "03",
    title: "Actually do the thing",
    body: "Track progress automatically. Get a heads up when you're cutting it close. Keep your word and pay nothing.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      style={{
        padding: "72px 40px",
        maxWidth: 860,
        margin: "0 auto",
      }}
      className="how-section"
    >
      <p
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        How it works
      </p>

      <div className="steps-grid">
        {steps.map((s) => (
          <div
            key={s.num}
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 12,
              padding: "28px 24px",
              border: "0.5px solid var(--border)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--text-tertiary)",
                marginBottom: 14,
                letterSpacing: "0.06em",
              }}
            >
              {s.num}
            </p>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: 10,
              }}
            >
              {s.title}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.65,
              }}
            >
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 40px;
        }
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr; }
          .how-section { padding: 56px 20px !important; }
        }
      `}</style>
    </section>
  );
}
