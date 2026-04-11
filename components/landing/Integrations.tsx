const integrations = [
  { label: "F", name: "Fitbit", bg: "#00B0B9", color: "#fff" },
  { label: "S", name: "Strava", bg: "#FC4C02", color: "#fff" },
  { label: "A", name: "Apple Health", bg: "#1a1a1a", color: "#fff" },
  { label: "Sl", name: "Slack", bg: "#4A154B", color: "#fff" },
  { label: "Sp", name: "Spotify", bg: "#1DB954", color: "#fff" },
  { label: "D", name: "Duolingo", bg: "#58CC02", color: "#fff" },
  { label: "G", name: "Garmin", bg: "#007CC3", color: "#fff" },
  { label: "T", name: "Todoist", bg: "#DB4035", color: "#fff" },
  {
    label: "N",
    name: "Notion",
    bg: "#fff",
    color: "#0d0d0d",
    border: "0.5px solid rgba(0,0,0,0.14)",
  },
  { label: "G", name: "GitHub", bg: "#24292F", color: "#fff" },
  {
    label: "G",
    name: "Google Fit",
    bg: "#fff",
    color: "#4285F4",
    border: "0.5px solid rgba(0,0,0,0.14)",
  },
  { label: "R", name: "RescueTime", bg: "#1B4F72", color: "#fff" },
  { label: "W", name: "Whoop", bg: "#111", color: "#00FF87" },
  { label: "O", name: "Oura Ring", bg: "#2D2D2D", color: "#C8A951" },
  { label: "R", name: "Runkeeper", bg: "#3BB4E5", color: "#fff" },
];

export default function Integrations() {
  return (
    <div
      style={{
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
        padding: "64px 40px",
      }}
      className="integrations-wrap"
    >
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Works with the apps you already use.
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Connect once. Track automatically. No manual logging.
        </p>
      </div>

      <div className="integrations-grid">
        {integrations.map((item, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-secondary)",
              border: "0.5px solid var(--border)",
              borderRadius: 12,
              padding: "16px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 500,
                background: item.bg,
                color: item.color,
                border: item.border,
                flexShrink: 0,
              }}
            >
              {item.label}
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                textAlign: "center",
              }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-tertiary)",
          marginTop: 16,
        }}
      >
        And 50+ more. If you use it, Sworn probably connects to it.
      </p>

      <style>{`
        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          max-width: 860px;
          margin: 0 auto 16px;
        }
        @media (max-width: 768px) {
          .integrations-grid { grid-template-columns: repeat(3, 1fr); }
          .integrations-wrap { padding: 48px 20px !important; }
        }
      `}</style>
    </div>
  );
}
