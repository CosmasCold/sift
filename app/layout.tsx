// app/layout.tsx (for thesift.space)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gabriel Freitas – Founder of SiteSafe",
  description:
    "Personal site of Gabriel Freitas, a solo founder building SiteSafe, a smart visitor management platform. No sales calls, flat pricing, mandatory safety acknowledgment.",
  openGraph: {
    title: "Gabriel Freitas – Founder of SiteSafe",
    description:
      "Personal site of Gabriel Freitas, a solo founder building SiteSafe, a smart visitor management platform.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-image: linear-gradient(
                rgba(15, 23, 42, 0.7),
                rgba(15, 23, 42, 0.7)
              ),
              url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            color: #e2e8f0;
            line-height: 1.6;
          }
          a {
            color: inherit;
            text-decoration: none;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}