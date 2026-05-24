import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), 'content/blog');
  const filenames = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));
  return filenames.map(filename => ({ slug: filename.replace('.mdx', '') }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.mdx`);

  if (!fs.existsSync(filePath)) notFound();

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const mdxSource = await serialize(content);

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to blog
      </Link>

      <GlassCard className="p-6 md:p-8">
        <h1 className="text-3xl font-semibold text-surface-50 mb-2">{data.title}</h1>
        <p className="text-xs text-surface-400 mb-6">
          {new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <div className="prose prose-invert max-w-none text-surface-200">
          <MDXRemote source={mdxSource} />
        </div>
      </GlassCard>
    </main>
  );
}