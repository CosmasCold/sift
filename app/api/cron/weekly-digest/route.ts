import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  // Service role client – allows admin API calls
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get all users who have opted in
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, username')
    .eq('weekly_digest', true);

  if (profileError || !profiles) {
    return NextResponse.json({ error: 'No profiles found' }, { status: 500 });
  }

  let sent = 0;

  for (const profile of profiles) {
    // Get user email using admin API
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userError || !user?.email) continue;

    // Fetch top kept articles from the past week
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

    // Build email HTML
    const articleList = articles.map(a => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #3e3a35;">
          <p style="margin:0; font-size:14px; color:#d3cbc0;">${a.summary.substring(0, 150)}…</p>
          <p style="margin:4px 0 0; font-size:12px; color:#a39a90;">${a.verdict}</p>
        </td>
      </tr>
    `).join('');

    const html = `
      <div style="max-width:600px;margin:0 auto;background:#1a1714;border-radius:16px;padding:24px;font-family:system-ui,sans-serif;">
        <h1 style="color:#f0ede8;font-size:24px;margin:0 0 8px;">🧠 Your weekly Sift digest</h1>
        <p style="color:#a39a90;font-size:14px;margin:0 0 24px;">Here are the articles you kept this week, @${profile.username || 'reader'}.</p>
        <table style="width:100%;border-collapse:collapse;">${articleList}</table>
        <p style="margin:24px 0 0;font-size:12px;color:#8a8178;">Sent by Sift. <a href="https://sift-lac.vercel.app/settings" style="color:#c77d5a;">Manage digest settings</a>.</p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: 'Sift <digest@sift-lac.vercel.app>',
        to: user.email,
        subject: `Sift digest — ${articles.length} article${articles.length > 1 ? 's' : ''} you kept`,
        html,
      });
      sent++;
    } catch (e) {
      console.error(`Failed to send to ${user.email}`, e);
    }
  }

  return NextResponse.json({ sent });
}