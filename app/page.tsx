// app/page.tsx (for thesift.space)
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, ExternalLink, PenTool } from "lucide-react";

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
    <div className="min-h-screen">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-3xl border border-white/10 shadow-card-raised p-10 sm:p-14">
          <div className="flex justify-center mb-6">
            <Image
              src="/avatar.png"
              alt="Gabriel"
              width={96}
              height={96}
              className="rounded-full border-2 border-sky-400"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Gabriel
          </h1>
          <p className="mt-3 text-xl text-sky-400 font-semibold">
            Solo founder of SiteSafe
          </p>
          <p className="mt-4 max-w-xl mx-auto text-slate-300 leading-relaxed">
            I build simple, honest software for small businesses. No sales
            calls, flat pricing —that’s my
            thing.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://sitesafe.thesift.space"
              target="_blank"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-slate-900 bg-white hover:bg-slate-100 transition-all duration-200 shadow-lg"
            >
              Try SiteSafe free <ExternalLink className="ml-2 w-4 h-4" />
            </Link>
            <a
              href="#writing"
              className="inline-flex items-center justify-center px-6 py-3 border border-white/10 text-base font-medium rounded-xl text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              Read my writing ↓
            </a>
          </div>
        </div>
      </div>

      {/* Founder Story */}
      <div className="max-w-3xl mx-auto px-4 pb-24">
        <div className="bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/10 shadow-card-raised p-8">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-sky-400" /> The story
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-slate-200">
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
          </div>
        </div>
      </div>

      {/* Writing / Blog */}
      <div id="writing" className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
          <PenTool className="w-6 h-6 text-sky-400" /> Writing
        </h2>
        <div className="space-y-4">
          {blogPosts.map((post) => (
            <a
              key={post.href}
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/10 shadow-card-raised p-5 hover:shadow-card-raised transition-shadow duration-300"
            >
              <p className="text-sm text-slate-400">{post.date}</p>
              <h3 className="text-white font-medium mt-1">{post.title}</h3>
              <p className="text-xs text-sky-400 mt-2 flex items-center gap-1">
                Read on SiteSafe blog <ExternalLink className="w-3 h-3" />
              </p>
            </a>
          ))}
        </div>
        <p className="text-sm text-slate-400 mt-6 text-center">
          More articles on the{" "}
          <a
            href="https://sitesafe.thesift.space/blog"
            target="_blank"
            className="text-sky-400 hover:underline"
          >
            SiteSafe blog
          </a>.
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Gabriel. Built in Brazil.
          </div>
          <div className="flex gap-4">
            <a
              href="https://sitesafe.thesift.space"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              SiteSafe
            </a>
            <a
              href="https://linkedin.com/in/benediktfreitas"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://twitter.com/sitesafehq"
              target="_blank"
              className="hover:text-white transition-colors"
            >
              Twitter
            </a>
            <a
              href="mailto:hello@thesift.space"
              className="hover:text-white transition-colors"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}