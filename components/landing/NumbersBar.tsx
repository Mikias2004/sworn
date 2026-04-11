const numbers = [
  { val: "$2.3M", label: "pledged by users" },
  { val: "14,800", label: "goals set" },
  { val: "73%", label: "hit rate" },
  { val: "4.9", label: "average rating" },
];

export default function NumbersBar() {
  return (
    <>
      <div className="numbers-bar">
        {numbers.map((n, i) => (
          <div
            key={i}
            style={{
              padding: "28px 20px",
              textAlign: "center",
              borderRight:
                i < numbers.length - 1 ? "0.5px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 500,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                marginBottom: 5,
              }}
            >
              {n.val}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {n.label}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .numbers-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 0.5px solid var(--border);
          border-bottom: 0.5px solid var(--border);
        }
        @media (max-width: 768px) {
          .numbers-bar {
            grid-template-columns: repeat(2, 1fr);
          }
          .numbers-bar > div:nth-child(2) {
            border-right: none !important;
          }
        }
      `}</style>
    </>
  );
}
