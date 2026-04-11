export default function Problem() {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderTop: "0.5px solid var(--border)",
        borderBottom: "0.5px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "72px 40px",
        }}
        className="problem-inner"
      >
        <p
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Sound familiar?
        </p>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            marginBottom: 16,
          }}
        >
          You&apos;ve started this goal before. More than once, probably.
        </h2>
        <p
          style={{
            fontSize: 17,
            color: "var(--text-secondary)",
            lineHeight: 1.75,
            marginBottom: 24,
          }}
        >
          The gym membership. The side project. The habit you keep restarting
          every January. You know exactly what to do. That was never the issue.
        </p>
        <p
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          When nothing is on the line, it&apos;s too easy to walk away.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .problem-inner { padding: 56px 20px !important; }
        }
      `}</style>
    </div>
  );
}
