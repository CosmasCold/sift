// app/page.tsx (for thesift.space)
export default function PersonalSite() {
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 py-24 sm:py-32 text-center">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-10 sm:p-14">
          <div className="w-24 h-24 rounded-full border-2 border-sky-400 mx-auto overflow-hidden mb-6">
            <img
              src="/gabriel-headshot.png"
              alt="Gabriel"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Gabriel
          </h1>
          <p className="text-xl text-sky-400 font-semibold mt-2">
            Solo founder of SiteSafe
          </p>
          <p className="max-w-md mx-auto text-slate-300 mt-4 leading-relaxed">
            I build simple, honest software for small businesses. No sales
            calls, flat pricing, and mandatory safety acknowledgment—that's my
            thing.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mt-8">
            <a
              href="https://sitesafe.thesift.space"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Try SiteSafe free
              <span className="text-lg">↗</span>
            </a>
            <a
              href="#writing"
              className="inline-flex items-center px-6 py-3 border border-white/15 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              Read my writing ↓
            </a>
          </div>
        </div>
      </div>

      {/* Founder Story */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">The story</h2>
          <div className="text-sm leading-relaxed text-slate-300 space-y-4">
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

            <div className="mt-6 pt-6 border-t border-white/10 text-slate-400 italic text-xs">
              <p>
                <strong className="not-italic text-slate-200">Why thesift?</strong>{" "}
                Before SiteSafe, I built another tool here, but that's not the
                point. I kept the domain because “sift” describes how I work. I
                sift through ideas, problems, and feedback to find the one thing
                worth focusing on. SiteSafe came out of that process. Whatever
                comes next probably will too.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Writing – two‑column */}
      <div id="writing" className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-semibold text-white mb-6">Writing</h2>

        <div className="flex flex-wrap gap-6">
          {/* Featured article */}
          <div className="flex-1 min-w-[300px]">
            <a
              href="https://thenextscoop.com/how-i-got-my-first-10-saas-customers-without-a-single-sales-call/"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-br from-sky-500/15 to-sky-500/5 backdrop-blur-md border border-sky-400/30 rounded-2xl p-6 text-white hover:shadow-lg transition-shadow h-full"
            >
              <span className="inline-block bg-sky-500 text-white text-xs font-semibold px-2.5 py-1 rounded uppercase tracking-wide mb-3">
                Featured on The Next Scoop
              </span>
              <h3 className="text-xl font-semibold leading-snug">
                How I Got My First 10 SaaS Customers (Without a Single Sales Call)
              </h3>
              <p className="text-sm text-slate-400 mt-2">June 12, 2026</p>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                I built a simple visitor management tool and spent weeks sending
                cold emails and posting on social media. Zero replies. Then I
                stopped selling and started sharing genuinely useful content.
                That's when the first sign‑ups started coming in. Here's
                exactly what I did.
              </p>
              <p className="text-sm text-sky-400 flex items-center gap-1 mt-4">
                Read on The Next Scoop <span>↗</span>
              </p>
            </a>
          </div>

          {/* Other posts column */}
          <div className="flex-1 min-w-[250px] space-y-4">
            {blogPosts.map((post) => (
              <a
                key={post.href}
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-white hover:bg-white/10 transition-colors"
              >
                <p className="text-xs text-slate-400">{post.date}</p>
                <h3 className="text-base font-medium mt-1 leading-snug">{post.title}</h3>
                <p className="text-xs text-sky-400 flex items-center gap-1 mt-2">
                  Read on SiteSafe blog <span>↗</span>
                </p>
              </a>
            ))}
            <p className="text-center text-xs text-slate-500 mt-4">
              More articles on the{" "}
              <a
                href="https://sitesafe.thesift.space/blog"
                target="_blank"
                className="text-sky-400 underline"
              >
                SiteSafe blog
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <div>&copy; {new Date().getFullYear()} Gabriel. Built in Brazil.</div>
          <div className="flex gap-4">
            <a href="https://sitesafe.thesift.space" target="_blank" className="hover:text-white transition-colors">
              SiteSafe
            </a>
            <a href="https://linkedin.com/in/yourprofile" target="_blank" className="hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://twitter.com/yourhandle" target="_blank" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="mailto:cloudandclipboard@gmail.com" className="hover:text-white transition-colors">
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}