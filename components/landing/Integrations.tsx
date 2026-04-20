const integrations: Array<{ name: string; iconSlug: string; iconColor: string }> = [
  { name: "Strava",       iconSlug: "strava",       iconColor: "FC4C02" },
  { name: "Apple Health", iconSlug: "apple",        iconColor: "000000" },
  { name: "Fitbit",       iconSlug: "fitbit",       iconColor: "00B0B9" },
  { name: "Duolingo",     iconSlug: "duolingo",     iconColor: "58CC02" },
  { name: "Garmin",       iconSlug: "garmin",       iconColor: "007CC3" },
  { name: "Runkeeper",    iconSlug: "runkeeper",    iconColor: "1F63FF" },
  { name: "Todoist",      iconSlug: "todoist",      iconColor: "E44332" },
  { name: "Notion",       iconSlug: "notion",       iconColor: "000000" },
  { name: "GitHub",       iconSlug: "github",       iconColor: "181717" },
  { name: "Google Fit",   iconSlug: "googlefit",    iconColor: "00C853" },
  { name: "RescueTime",   iconSlug: "rescuetime",   iconColor: "161A3B" },
  { name: "Whoop",        iconSlug: "whoop",        iconColor: "0A0A0A" },
  { name: "Oura Ring",    iconSlug: "oura",         iconColor: "000000" },
  { name: "Spotify",      iconSlug: "spotify",      iconColor: "1DB954" },
  { name: "Slack",        iconSlug: "slack",        iconColor: "4A154B" },
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
        {integrations.map((item) => (
          <div
            key={item.name}
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
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(0,0,0,0.04)",
                border: "0.5px solid rgba(0,0,0,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://cdn.simpleicons.org/${item.iconSlug}/${item.iconColor}`}
                width={24}
                height={24}
                alt={item.name}
                style={{ display: "block" }}
              />
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
