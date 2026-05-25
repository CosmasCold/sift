import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ChangelogPage() {
  const filePath = path.join(process.cwd(), 'content/changelog.mdx');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return (
    <main className="flex-1 pt-12 pb-16 px-4 max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-surface-400 hover:text-surface-200 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Sift
      </Link>

      <GlassCard className="p-6 md:p-8">
        <h1 className="text-3xl font-semibold text-surface-50 mb-2">{data.title}</h1>
        <div className="blog-content">
          <MDXRemote source={content} />
        </div>
      </GlassCard>
    </main>
  );
}