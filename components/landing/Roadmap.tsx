const features = [
  {
    name: "Smart goal setup",
    tag: "Shipped",
    dotColor: "#3B6D11",
    votes: "1.2k",
    canVote: false,
  },
  {
    name: "Apple Health integration",
    tag: "In progress",
    dotColor: "#185FA5",
    votes: "847",
    canVote: true,
  },
  {
    name: "Android app",
    tag: "Under review",
    dotColor: "#888780",
    votes: "623",
    canVote: true,
  },
  {
    name: "SMS reminders",
    tag: "Under review",
    dotColor: "#888780",
    votes: "411",
    canVote: true,
  },
];

export default function Roadmap() {
  return (
    <div style={{ borderBottom: "0.5px solid var(--border)" }}>
      <div
        id="roadmap"
        style={{
          padding: "72px 40px",
          maxWidth: 860,
          margin: "0 auto",
        }}
        className="roadmap-wrap"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              You shape what gets built.
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Vote on features, drop your ideas, watch them ship.
            </p>
          </div>
          <button
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              border: "0.5px solid var(--border-md)",
              padding: "8px 16px",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            Submit an idea
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg-secondary)",
                borderRadius: 8,
                padding: "14px 18px",
                border: "0.5px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: f.dotColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontSize: 14, color: "var(--text-primary)" }}
                >
                  {f.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    background: "#fff",
                    border: "0.5px solid var(--border)",
                    borderRadius: 99,
                    padding: "2px 10px",
                  }}
                >
                  {f.tag}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {f.canVote && (
                  <button
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      border: "0.5px solid var(--border)",
                      borderRadius: 8,
                      padding: "5px 12px",
                      background: "#fff",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ▲ Vote
                  </button>
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  {f.votes}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .roadmap-wrap { padding: 56px 20px !important; }
        }
      `}</style>
    </div>
  );
}
