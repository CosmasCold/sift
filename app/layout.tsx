// app/layout.tsx (for thesift.space)
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gabriel – Founder of SiteSafe",
  description:
    "Personal site of Gabriel Freitas, solo founder of SiteSafe, a smart visitor management platform.",
  openGraph: {
    title: "Gabriel – Founder of SiteSafe",
    description:
      "Personal site of Gabriel Freitas, solo founder of SiteSafe, a smart visitor management platform.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}