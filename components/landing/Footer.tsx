import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        padding: "22px 40px",
        borderTop: "0.5px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      className="footer"
    >
      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
        Sworn. 2026
      </span>
      <div style={{ display: "flex", gap: 24 }}>
        {["Privacy", "Terms", "Contact"].map((link) => (
          <Link
            key={link}
            href={`/${link.toLowerCase()}`}
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              textDecoration: "none",
            }}
          >
            {link}
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer {
            padding: 20px !important;
            flex-direction: column !important;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}
