import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-surface-700/50 bg-surface-800/60 backdrop-blur-xl py-6 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-surface-400">
        <div>© {new Date().getFullYear()} Sift — A Pause Studio product</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-accent-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-accent-400 transition-colors">Terms</Link>
          <Link href="/faq" className="hover:text-accent-400 transition-colors">FAQ</Link>
          <Link href="/contact" className="hover:text-accent-400 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}