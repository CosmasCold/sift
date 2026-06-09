// app/layout.tsx (for thesift.space)
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gabriel – Founder of SiteSafe",
  description:
    "Personal site of Gabriel Freitas, a solo founder building SiteSafe, a smart visitor management platform. No sales calls, flat pricing, mandatory safety acknowledgment.",
  openGraph: {
    title: "Gabriel – Founder of SiteSafe",
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
      <body className="min-h-screen bg-slate-950 text-white font-sans">
        {children}
      </body>
    </html>
  );
}