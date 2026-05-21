import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SiftRow {
  id: string;
  user_id: string;
  summary: string | null;
  verdict: string;
  kept: boolean;
  user_profiles: { email: string }[];   // <-- array from Supabase join
}

export async function GET() {
  const supabase = await createClient();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const { data } = await supabase
    .from('sifted_articles')
    .select('id, user_id, summary, verdict, kept, user_profiles(email)')
    .gte('created_at', weekStart.toISOString())
    .eq('kept', true)
    .order('created_at', { ascending: false });

  const users: SiftRow[] = (data as SiftRow[]) ?? [];

  if (users.length === 0) {
    return NextResponse.json({ message: 'No digests to send' });
  }

  // Group by user
  const userMap = new Map<string, { email: string; articles: SiftRow[] }>();
  for (const row of users) {
    const userId = row.user_id;
    if (!userMap.has(userId)) {
      const profile = row.user_profiles?.[0];
      userMap.set(userId, {
        email: profile?.email ?? '',
        articles: [],
      });
    }
    userMap.get(userId)!.articles.push(row);
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
  }

  const results = await Promise.allSettled(
    Array.from(userMap.entries()).map(async ([, data]) => {
      if (!data.email) return { error: 'No email for user' };

      const articlesHtml = data.articles
        .map(
          (a) => `
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
                <p style="margin:0;font-weight:500;color:#1c1917;">${a.summary?.substring(0, 120) ?? ''}…</p>
                <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${a.verdict}</p>
              </td>
            </tr>
          `
        )
        .join('');

      const html = `
        <div style="max-width:600px;margin:0 auto;font-family:sans-serif;">
          <div style="background:#5b4b8a;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;">📚 Your Weekly Sift</h1>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#4b5563;">Here's what you kept this week:</p>
            <table style="width:100%;border-collapse:collapse;">
              ${articlesHtml}
            </table>
            <a href="https://sift.pauseapp.space/library" style="display:inline-block;margin-top:16px;background:#5b4b8a;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;">View Library</a>
          </div>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Sift <sift@pauseapp.space>',
          to: data.email,
          subject: 'Your Weekly Sift Digest',
          html,
        }),
      });
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return NextResponse.json({ message: `Digests sent: ${sent}` });
}