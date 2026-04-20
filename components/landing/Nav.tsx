"use client";

import Link from "next/link";

export default function Nav() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 40px",
        borderBottom: "0.5px solid var(--border)",
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          textDecoration: "none",
        }}
      >
        Sworn.
      </Link>

      <div style={{ display: "flex", gap: 28 }} className="nav-links">
        <button
          onClick={() => scrollTo("how")}
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-secondary)")
          }
        >
          How it works
        </button>
        <button
          onClick={() => scrollTo("pricing")}
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-secondary)")
          }
        >
          Pricing
        </button>
        <button
          onClick={() => scrollTo("roadmap")}
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-secondary)")
          }
        >
          Roadmap
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link
          href="/login"
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            textDecoration: "none",
            padding: "8px 14px",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-primary)")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.color = "var(--text-secondary)")
          }
        >
          Log in
        </Link>
        <Link
          href="/signup"
          style={{
            fontSize: 13,
            fontWeight: 500,
            background: "var(--text-primary)",
            color: "#fff",
            padding: "8px 18px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Start for free
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
