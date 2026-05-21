import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, username, public_profile')
    .eq('username', username)
    .maybeSingle();

  if (!profile || !profile.public_profile) {
    return new NextResponse('Profile not found or private', { status: 404 });
  }

  const { data: articles } = await supabase
    .from('sifted_articles')
    .select('summary, verdict, source_url, created_at')
    .eq('user_id', profile.id)
    .eq('kept', true)
    .order('created_at', { ascending: false })
    .limit(20);

  // If no articles, return an empty feed
  if (!articles || articles.length === 0) {
    const emptyRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(profile.username)}'s Sift Library</title>
    <link>${process.env.NEXT_PUBLIC_URL || 'https://sift-lac.vercel.app'}/profile/${username}</link>
    <description>No articles yet.</description>
  </channel>
</rss>`;
    return new NextResponse(emptyRss, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://sift-lac.vercel.app';

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(profile.username)}'s Sift Library</title>
    <link>${siteUrl}/profile/${username}</link>
    <description>Articles kept by ${escapeXml(profile.username)} on Sift</description>
    <atom:link href="${siteUrl}/profile/${username}/feed.xml" rel="self" type="application/rss+xml" />
    ${articles.map(article => `
      <item>
        <title>${escapeXml(article.summary.substring(0, 100))}</title>
        <link>${article.source_url || siteUrl}</link>
        <guid>${article.source_url || `${siteUrl}/article/${Date.now()}`}</guid>
        <pubDate>${new Date(article.created_at).toUTCString()}</pubDate>
        <description><![CDATA[${article.summary}<br/>Verdict: ${article.verdict}]]></description>
      </item>
    `).join('')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}