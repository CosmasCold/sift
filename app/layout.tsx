import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sift — Save, Summarize, Sift',
  description: 'Save articles. Let AI sift them. Get the insight in seconds.',
  icons: {
    icon: '/favicon.png', // or favicon.ico
  },
  openGraph: {
    title: 'Sift — Save, Summarize, Sift',
    description: 'AI-powered reading triage. Sift articles and keep what matters.',
    url: 'https://siftapp.space',
    siteName: 'Sift',
    images: [
      {
        url: 'https://siftapp.space/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sift — AI reading triage',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sift — Save, Summarize, Sift',
    description: 'AI-powered reading triage. Sift articles and keep what matters.',
    images: ['https://siftapp.space/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-surface-900 text-surface-50`}>
        <div className="noise-overlay" />
        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
        <Toaster
  position="top-center"
  toastOptions={{
    style: {
      background: 'rgba(46, 40, 57, 0.6)', // surface-800/60
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(92, 80, 112, 0.5)', // surface-700/50
      borderRadius: '1rem',
      boxShadow: '0 8px 32px 0 rgba(23, 19, 34, 0.3), inset 0 1px 0 0 rgba(255,255,255,0.05)',
      color: '#f6f4f9', // surface-50
      fontSize: '0.875rem',
      padding: '12px 16px',
    },
    success: {
      iconTheme: {
        primary: '#10b981', // verdict-green
        secondary: '#f6f4f9',
      },
    },
    error: {
      iconTheme: {
        primary: '#ef4444', // red-500
        secondary: '#f6f4f9',
      },
    },
    loading: {
      iconTheme: {
        primary: '#b4a7d6', // accent-400
        secondary: '#f6f4f9',
      },
    },
  }}
/>
      </body>
    </html>
  );
}