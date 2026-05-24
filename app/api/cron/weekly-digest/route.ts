import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== 'sift-cron-8a7f3b2c-4e1d-4f6a-9c3e-2b7a5d1f0e8c') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.BREVO_API_KEY!;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, username')
    .eq('weekly_digest', true);

  if (profileError || !profiles) {
    return NextResponse.json({ error: 'No profiles found' }, { status: 500 });
  }

  let sent = 0;

  for (const profile of profiles) {
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userError || !user?.email) continue;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: articles } = await supabaseAdmin
      .from('sifted_articles')
      .select('summary, verdict, source_url')
      .eq('user_id', profile.id)
      .eq('kept', true)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (!articles || articles.length === 0) continue;

    const articleList = articles.map((a, i) => `
      <div style="background:#fff;border:1px solid #e8e3dd;border-radius:14px;padding:18px 20px;margin-bottom:14px;${i === articles.length - 1 ? 'margin-bottom:0;' : ''}">
        <p style="font-size:15px;color:#1c1b18;margin:0 0 10px;line-height:1.5;">${a.summary.substring(0, 200)}${a.summary.length > 200 ? '…' : ''}</p>
        <span style="display:inline-block;font-size:12px;font-weight:500;color:#c77d5a;background:rgba(199,125,90,0.12);padding:4px 10px;border-radius:20px;">${a.verdict}</span>
      </div>
    `).join('');

    const html = `
      <div style="max-width:560px;margin:40px auto;background:#f8f6f2;border-radius:20px;padding:40px 32px;font-family:system-ui,-apple-system,sans-serif;color:#1c1b18;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="https://thesift.space/sift-logo.png" alt="Sift" style="height:36px;width:auto;" />
        </div>
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:28px;font-weight:600;color:#1c1b18;margin:0 0 8px;">Sift</h1>
          <p style="font-size:14px;color:#5e574f;margin:0;">Your weekly reading digest</p>
        </div>
        <p style="font-size:15px;color:#5e574f;margin:0 0 24px;line-height:1.6;">Hi @${profile.username || 'reader'}, here are the articles you kept this week.</p>
        ${articleList}
        <div style="text-align:center;margin-top:28px;">
          <a href="https://thesift.space/library" style="display:inline-block;background:#c77d5a;color:#fff;font-size:14px;font-weight:500;text-decoration:none;padding:12px 28px;border-radius:30px;">View your library</a>
        </div>
        <div style="margin-top:36px;padding-top:24px;border-top:1px solid #e8e3dd;text-align:center;">
          <p style="font-size:12px;color:#7a7268;margin:0;">Sent by Sift · <a href="https://thesift.space/settings" style="color:#c77d5a;text-decoration:none;">Manage digest settings</a></p>
        </div>
      </div>
    `;

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: 'digest@thesift.space', name: 'Sift' },
          to: [{ email: user.email }],
          subject: `Sift digest — ${articles.length} article${articles.length > 1 ? 's' : ''} you kept`,
          htmlContent: html,
        }),
      });
      if (res.ok) sent++;
      else console.error('Brevo send failed:', await res.text());
    } catch (e) {
      console.error(`Failed to send to ${user.email}`, e);
    }
  }

  return NextResponse.json({ sent });
}