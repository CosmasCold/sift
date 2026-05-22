import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// @ts-expect-error "ignore"
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sift — Save, Summarize, Sift',
  description: 'Save articles. Let AI sift them. Get the insight in seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <div className="noise-overlay" />
        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}