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
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'Sift — Save, Summarize, Sift',
    description: 'AI-powered reading triage. Sift articles and keep what matters.',
    url: 'https://sift-lac.vercel.app',
    siteName: 'Sift',
    images: [
      {
        url: 'https://sift-lac.vercel.app/og-image.png',
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
    images: ['https://sift-lac.vercel.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'light' || (!theme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-surface-900 text-surface-50 transition-colors`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-surface-800 focus:text-surface-50 focus:rounded-xl focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="noise-overlay" />
        <Navbar />
        <main id="main-content" className="flex-1 relative z-10">{children}</main>
        <Footer />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(46, 40, 57, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(92, 80, 112, 0.5)',
              borderRadius: '1rem',
              boxShadow:
                '0 8px 32px 0 rgba(23, 19, 34, 0.3), inset 0 1px 0 0 rgba(255,255,255,0.05)',
              color: '#f6f4f9',
              fontSize: '0.875rem',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f6f4f9',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f6f4f9',
              },
            },
            loading: {
              iconTheme: {
                primary: '#b4a7d6',
                secondary: '#f6f4f9',
              },
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    () => console.log('Service Worker registered'),
                    (err) => console.error('Service Worker registration failed:', err)
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}