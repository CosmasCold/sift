import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-stone-200/30 bg-white/40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto py-6 px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-stone-600">
        <div>© {new Date().getFullYear()} Sift — A Pause Studio product</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-md">Privacy</Link>
          <Link href="/terms" className="hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-md">Terms</Link>
          <Link href="/faq" className="hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-md">FAQ</Link>
          <Link href="/contact" className="hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-md">Contact</Link>
        </div>
      </div>
    </footer>
  );
}