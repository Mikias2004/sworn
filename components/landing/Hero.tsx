import Link from "next/link";

export default function Hero() {
  return (
    <section
      style={{
        padding: "88px 40px 72px",
        textAlign: "center",
        maxWidth: 860,
        margin: "0 auto",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: 12,
          color: "var(--text-secondary)",
          border: "0.5px solid var(--border-md)",
          borderRadius: 99,
          padding: "4px 16px",
          marginBottom: 28,
          letterSpacing: "0.06em",
        }}
      >
        Goal tracking with real stakes
      </span>

      <h1
        style={{
          fontSize: 58,
          fontWeight: 500,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
          marginBottom: 20,
        }}
        className="hero-title"
      >
        Put your money
        <br />
        where your mouth is.
      </h1>

      <p
        style={{
          fontSize: 18,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          maxWidth: 440,
          margin: "0 auto 14px",
        }}
      >
        Set a goal. Put real money on the line. Miss it and you pay. Crush it
        and you owe nothing. Simple as that.
      </p>

      <p
        style={{
          fontSize: 13,
          color: "var(--text-tertiary)",
          marginBottom: 36,
        }}
      >
        Join{" "}
        <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>
          2,400 people
        </strong>{" "}
        who actually mean it.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/signup"
          style={{
            fontSize: 14,
            fontWeight: 500,
            background: "var(--text-primary)",
            color: "#fff",
            padding: "12px 28px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Start for free
        </Link>
        <a
          href="#how"
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            padding: "12px 28px",
            borderRadius: 8,
            border: "0.5px solid var(--border-md)",
            background: "transparent",
            textDecoration: "none",
          }}
        >
          See how it works
        </a>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-title { font-size: 36px !important; }
          section { padding: 56px 20px 48px !important; }
        }
      `}</style>
    </section>
  );
}
