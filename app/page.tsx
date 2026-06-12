// app/page.tsx (for thesift.space)
import Link from "next/link";

const blogPosts = [
  {
    title: "The Ultimate Guide to Modern Visitor Management",
    href: "https://sitesafe.thesift.space/blog/ultimate-guide-modern-visitor-management",
    date: "2026-06-09",
  },
  {
    title: "SiteSafe vs Envoy vs SwipedOn vs Paper Logs",
    href: "https://sitesafe.thesift.space/blog/sitesafe-vs-envoy-swipedon-paper",
    date: "2026-06-04",
  },
  {
    title: "How a Small Business Chooses a Visitor Log",
    href: "https://sitesafe.thesift.space/blog/case-study-small-business",
    date: "2026-06-06",
  },
  {
    title: "The Real Cost of a Failed Safety Audit",
    href: "https://sitesafe.thesift.space/blog/cost-of-failed-safety-audit",
    date: "2026-06-03",
  },
];

export default function PersonalSite() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "100px 16px 80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "24px",
            padding: "48px 32px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {/* Headshot */}
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              border: "2px solid #0ea5e9",
              margin: "0 auto 24px",
              overflow: "hidden",
            }}
          >
            <img
              src="/gabriel-headshot.png"
              alt="Gabriel"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
          <h1
            style={{
              fontSize: "2.8rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Gabriel
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              color: "#0ea5e9",
              fontWeight: 600,
              marginTop: "8px",
            }}
          >
            Solo founder of SiteSafe
          </p>
          <p
            style={{
              maxWidth: "480px",
              margin: "16px auto 0",
              color: "#cbd5e1",
              fontSize: "1rem",
            }}
          >
            I build simple, honest software for small businesses. No sales
            calls, flat pricing, and mandatory safety acknowledgment—that’s my
            thing.
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "32px",
            }}
          >
            <a
              href="https://sitesafe.thesift.space"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "#fff",
                color: "#0f172a",
                fontWeight: 600,
                borderRadius: "12px",
                fontSize: "0.95rem",
                transition: "background 0.2s",
                textDecoration: "none",
              }}
            >
              Try SiteSafe free
              <span style={{ fontSize: "1.1rem" }}>↗</span>
            </a>
            <a
              href="#writing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "12px 24px",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                color: "#e2e8f0",
                fontWeight: 500,
                fontSize: "0.95rem",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
            >
              Read my writing ↓
            </a>
          </div>
        </div>
      </div>

      {/* Founder Story */}
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "0 16px 80px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "32px",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📖 The story
          </h2>
          <div
            style={{
              fontSize: "0.9rem",
              lineHeight: "1.7",
              color: "#cbd5e1",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <p>
              I wanted to build something useful. I spent a few weeks
              researching common problems in small to medium businesses. One
              theme kept coming up: tracking visitors. Construction sites,
              warehouses, offices—they all rely on paper sign‑in sheets that
              get lost or ruined, and the existing digital tools are expensive
              and complicated.
            </p>
            <p>
              So I built SiteSafe. A tablet‑friendly check‑in with a mandatory
              safety acknowledgment. No paper, no lost records, no sales calls.
              Just a simple tool that solves a real problem.
            </p>
            <p>
              Everything you see—the product, the website, the emails—is built
              and run by one person. No sales team, no board, no hidden fees.
              Just me, solving a problem I care about.
            </p>

            {/* Why thesift */}
            <div
              style={{
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: "0.85rem",
                color: "#94a3b8",
                fontStyle: "italic",
              }}
            >
              <p>
                <strong style={{ fontStyle: "normal", color: "#e2e8f0" }}>
                  Why thesift?
                </strong>{" "}
                Before SiteSafe, I built another tool here, but that’s not the
                point. I kept the domain because “sift” describes how I work. I
                sift through ideas, problems, and feedback to find the one thing
                worth focusing on. SiteSafe came out of that process. Whatever
                comes next probably will too.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Writing */}
      <div
        id="writing"
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "0 16px 80px",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ✍️ Writing
        </h2>

        {/* Featured article – highlighted */}
        <a
          href="https://thenextscoop.com/how-i-got-my-first-10-saas-customers-without-a-single-sales-call/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.05))",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(14,165,233,0.3)",
            borderRadius: "16px",
            padding: "20px",
            color: "#e2e8f0",
            textDecoration: "none",
            marginBottom: "24px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#0ea5e9",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "4px",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Featured on The Next Scoop
          </div>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              marginTop: "4px",
            }}
          >
            How I Got My First 10 SaaS Customers (Without a Single Sales Call)
          </h3>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#94a3b8",
              marginTop: "4px",
            }}
          >
            June 12, 2026
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#0ea5e9",
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Read on The Next Scoop <span>↗</span>
          </p>
        </a>

        {/* Other blog posts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {blogPosts.map((post) => (
            <a
              key={post.href}
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                padding: "20px",
                color: "#e2e8f0",
                textDecoration: "none",
                transition: "box-shadow 0.2s",
              }}
            >
              <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                {post.date}
              </p>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  marginTop: "4px",
                }}
              >
                {post.title}
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#0ea5e9",
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Read on SiteSafe blog <span>↗</span>
              </p>
            </a>
          ))}
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#94a3b8",
            marginTop: "24px",
          }}
        >
          More articles on the{" "}
          <a
            href="https://sitesafe.thesift.space/blog"
            target="_blank"
            style={{ color: "#0ea5e9", textDecoration: "underline" }}
          >
            SiteSafe blog
          </a>.
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "32px 16px",
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "0.85rem",
            color: "#94a3b8",
          }}
        >
          <div>&copy; {new Date().getFullYear()} Gabriel. Built in Brazil.</div>
          <div style={{ display: "flex", gap: "16px" }}>
            <a
              href="https://sitesafe.thesift.space"
              target="_blank"
              style={{ color: "#94a3b8", textDecoration: "none" }}
            >
              SiteSafe
            </a>
            <a
              href="https://linkedin.com/in/yourprofile"
              target="_blank"
              style={{ color: "#94a3b8", textDecoration: "none" }}
            >
              LinkedIn
            </a>
            <a
              href="https://twitter.com/yourhandle"
              target="_blank"
              style={{ color: "#94a3b8", textDecoration: "none" }}
            >
              Twitter
            </a>
            <a
              href="mailto:cloudandclipboard@gmail.com"
              style={{ color: "#94a3b8", textDecoration: "none" }}
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}