import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm py-6 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
        <div>© {new Date().getFullYear()} Sift — A Pause Studio product</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-purple-500">Privacy</Link>
          <Link href="/terms" className="hover:text-purple-500">Terms</Link>
          <Link href="/faq" className="hover:text-purple-500">FAQ</Link>
          <Link href="/contact" className="hover:text-purple-500">Contact</Link>
        </div>
      </div>
    </footer>
  );
}