type CellValue = "check" | "cross" | string;

const rows: { feature: string; sworn: CellValue; habitica: CellValue; streaks: CellValue; beeminder: CellValue }[] = [
  { feature: "Real financial stakes", sworn: "check", habitica: "cross", streaks: "cross", beeminder: "check" },
  { feature: "Setup under 2 minutes", sworn: "check", habitica: "check", streaks: "check", beeminder: "cross" },
  { feature: "Auto app integrations", sworn: "check", habitica: "cross", streaks: "Some", beeminder: "Manual" },
  { feature: "Built for regular people", sworn: "check", habitica: "check", streaks: "check", beeminder: "cross" },
  { feature: "Expert setup support", sworn: "check", habitica: "cross", streaks: "cross", beeminder: "cross" },
  { feature: "Smart deadline nudges", sworn: "check", habitica: "Basic", streaks: "Basic", beeminder: "Basic" },
  { feature: "Free if you hit your goal", sworn: "check", habitica: "cross", streaks: "cross", beeminder: "check" },
];

function Cell({ value }: { value: CellValue }) {
  if (value === "check")
    return <span style={{ fontSize: 18, fontWeight: 500, color: "#3B6D11" }}>✓</span>;
  if (value === "cross")
    return <span style={{ fontSize: 18, fontWeight: 500, color: "#A32D2D" }}>✕</span>;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: "#854F0B",
        background: "#FAEEDA",
        borderRadius: 99,
        padding: "3px 10px",
        display: "inline-block",
      }}
    >
      {value}
    </span>
  );
}

export default function Comparison() {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
        padding: "72px 40px",
      }}
      className="comparison-wrap"
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
          How Sworn stacks up.
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Most habit apps are built on hope. Sworn is built on stakes.
        </p>
      </div>

      <table
        style={{
          width: "100%",
          maxWidth: 780,
          margin: "0 auto",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          border: "0.5px solid var(--border)",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                width: "34%",
                textAlign: "left",
                paddingLeft: 24,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-tertiary)",
                padding: "16px 0 16px 24px",
                borderBottom: "0.5px solid var(--border)",
              }}
            >
              Feature
            </th>
            <th
              style={{
                width: "17%",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
                padding: "16px 0",
                textAlign: "center",
                borderBottom: "0.5px solid var(--border)",
                background: "var(--bg-secondary)",
              }}
            >
              Sworn{" "}
              <span
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#3B6D11",
                  background: "#EAF3DE",
                  borderRadius: 99,
                  padding: "2px 8px",
                  marginLeft: 6,
                  verticalAlign: "middle",
                }}
              >
                us
              </span>
            </th>
            {["Habitica", "Streaks", "Beeminder"].map((h) => (
              <th
                key={h}
                style={{
                  width: "17%",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  padding: "16px 0",
                  textAlign: "center",
                  borderBottom: "0.5px solid var(--border)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom:
                  i < rows.length - 1 ? "0.5px solid var(--border)" : "none",
              }}
            >
              <td
                style={{
                  textAlign: "left",
                  paddingLeft: 24,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  padding: "16px 0 16px 24px",
                  verticalAlign: "middle",
                }}
              >
                {row.feature}
              </td>
              <td
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  padding: "16px 0",
                  verticalAlign: "middle",
                  background: "var(--bg-secondary)",
                }}
              >
                <Cell value={row.sworn} />
              </td>
              <td style={{ textAlign: "center", padding: "16px 0", verticalAlign: "middle" }}>
                <Cell value={row.habitica} />
              </td>
              <td style={{ textAlign: "center", padding: "16px 0", verticalAlign: "middle" }}>
                <Cell value={row.streaks} />
              </td>
              <td style={{ textAlign: "center", padding: "16px 0", verticalAlign: "middle" }}>
                <Cell value={row.beeminder} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        @media (max-width: 768px) {
          .comparison-wrap { padding: 56px 20px !important; overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}
