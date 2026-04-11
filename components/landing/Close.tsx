import Link from "next/link";

export default function Close() {
  return (
    <div
      style={{
        padding: "96px 40px",
        textAlign: "center",
        borderTop: "0.5px solid var(--border)",
      }}
      className="close-wrap"
    >
      <h2
        style={{
          fontSize: 42,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          color: "var(--text-primary)",
          marginBottom: 14,
          lineHeight: 1.15,
        }}
        className="close-title"
      >
        Be someone who
        <br />
        keeps their word.
      </h2>
      <p
        style={{
          fontSize: 17,
          color: "var(--text-secondary)",
          marginBottom: 36,
        }}
      >
        You already know what you need to do. Sworn just makes sure you do it.
      </p>
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

      <style>{`
        @media (max-width: 768px) {
          .close-wrap { padding: 64px 20px !important; }
          .close-title { font-size: 28px !important; }
        }
      `}</style>
    </div>
  );
}
