const quotes = [
  {
    text: '"Eight weeks straight. Not one missed session. Turns out $90 on the line is a very good alarm clock."',
    author: "Early user, Montreal",
  },
  {
    text: '"I bought that course 18 months ago. Sworn is the only reason I actually finished it."',
    author: "Early user, Toronto",
  },
];

export default function SocialProof() {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
        padding: "72px 40px",
      }}
      className="social-wrap"
    >
      <p
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 36,
        }}
      >
        Early users
      </p>

      <div className="quotes-grid">
        {quotes.map((q, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              border: "0.5px solid var(--border)",
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: "var(--text-primary)",
                lineHeight: 1.65,
                marginBottom: 14,
              }}
            >
              {q.text}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {q.author}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        .quotes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 860px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .quotes-grid { grid-template-columns: 1fr; }
          .social-wrap { padding: 56px 20px !important; }
        }
      `}</style>
    </div>
  );
}
