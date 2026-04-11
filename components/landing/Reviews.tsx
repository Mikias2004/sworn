const reviews = [
  {
    initials: "JT",
    name: "James T.",
    date: "March 2026",
    title: "I finally stopped lying to myself",
    body: "Set a reading goal in January. $30 on the line. Read more books in 10 weeks than I did all of last year.",
    tag: "Reading",
  },
  {
    initials: "SA",
    name: "Sofia A.",
    date: "February 2026",
    title: "The nudges alone are worth it",
    body: "Getting a reminder at 8pm saying I still have time changed everything. Only been charged once in two months.",
    tag: "Fitness",
  },
  {
    initials: "MR",
    name: "Marcus R.",
    date: "February 2026",
    title: "My streak finally means something",
    body: "67 days into learning Spanish. Tied it to Sworn with $20 on the line. The streak is real this time.",
    tag: "Learning",
  },
  {
    initials: "PL",
    name: "Priya L.",
    date: "January 2026",
    title: "Paid $5 once and never again",
    body: "Losing that first $5 was embarrassing enough. My side project launched last week.",
    tag: "Productivity",
  },
  {
    initials: "DK",
    name: "David K.",
    date: "January 2026",
    title: "Way easier than I expected",
    body: "Connected to Strava and was live in two minutes. Haven't missed a run since.",
    tag: "Running",
  },
  {
    initials: "NC",
    name: "Naomi C.",
    date: "December 2025",
    title: "Wish I found this sooner",
    body: "Used every habit app out there. None of them had real consequences. This one does. That's the whole difference.",
    tag: "Habits",
  },
];

export default function Reviews() {
  return (
    <div
      style={{
        padding: "72px 40px",
        borderBottom: "0.5px solid var(--border)",
      }}
      className="reviews-wrap"
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 36,
          maxWidth: 860,
          marginLeft: "auto",
          marginRight: "auto",
        }}
        className="reviews-top"
      >
        <div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            What people are saying.
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Real reviews from people who put their money where their mouth is.
          </p>
        </div>
        <div style={{ textAlign: "right" }} className="rating-big">
          <div
            style={{
              fontSize: 38,
              fontWeight: 500,
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            4.9
          </div>
          <div style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 5 }}>
            ★★★★★
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginTop: 3,
            }}
          >
            142 reviews
          </div>
        </div>
      </div>

      <div className="reviews-grid">
        {reviews.map((r, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 12,
              padding: 20,
              border: "0.5px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  flexShrink: 0,
                  border: "0.5px solid var(--border)",
                }}
              >
                {r.initials}
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 2,
                  }}
                >
                  {r.name}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {r.date}
                </p>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", flexShrink: 0 }}>
                ★★★★★
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              {r.title}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {r.body}
            </p>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                color: "var(--text-tertiary)",
                border: "0.5px solid var(--border)",
                borderRadius: 99,
                padding: "2px 10px",
                alignSelf: "flex-start",
              }}
            >
              {r.tag}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .reviews-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          max-width: 860px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .reviews-grid { grid-template-columns: 1fr; }
          .reviews-top { flex-direction: column !important; gap: 16px; align-items: flex-start !important; }
          .rating-big { text-align: left !important; }
          .reviews-wrap { padding: 56px 20px !important; }
        }
      `}</style>
    </div>
  );
}
