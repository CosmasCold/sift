import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GlassCard } from '@/components/ui/GlassCard';

interface PostMeta {
  title: string;
  date: string;
  description: string;
  slug: string;
}

export const metadata = {
  title: 'Blog | Sift',
  description: 'Thoughts on reading, focus, and building a calmer internet.',
};

export default function BlogPage() {
  const postsDir = path.join(process.cwd(), 'content/blog');
  const filenames = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));

  const posts: PostMeta[] = filenames
    .map(filename => {
      const filePath = path.join(postsDir, filename);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(raw);
      return {
        slug: filename.replace('.mdx', ''),
        title: data.title,
        date: data.date,
        description: data.description,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-surface-50 mb-2">Sift Blog</h1>
      <p className="text-surface-400 mb-8">
        Thoughts on reading, focus, and building a calmer internet.
      </p>

      <div>
        {posts.map(post => (
          <div key={post.slug} className="mb-6 last:mb-0">
            <Link href={`/blog/${post.slug}`}>
              <GlassCard variant="default" className="p-6 hover:-translate-y-0 transition-none">
                <h2 className="text-xl font-semibold text-surface-50 mb-1">{post.title}</h2>
                <p className="text-xs text-surface-400 mb-3">{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-surface-300">{post.description}</p>
              </GlassCard>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}