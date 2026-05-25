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

  // Find users who signed up exactly 3 days ago and haven't gotten the email yet
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const startOfDay = new Date(threeDaysAgo);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(threeDaysAgo);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, username')
    .eq('reengagement_sent', false)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (profileError || !profiles) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const profile of profiles) {
    // Check if they have any sifted articles
    const { count, error: countError } = await supabaseAdmin
      .from('sifted_articles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    if (countError || (count && count > 0)) {
      // They already sifted something – mark as sent so we don't check again
      await supabaseAdmin
        .from('user_profiles')
        .update({ reengagement_sent: true })
        .eq('id', profile.id);
      continue;
    }

    // Get user email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userError || !user?.email) continue;

    const html = `
      <div style="max-width:560px;margin:40px auto;background:#f8f6f2;border-radius:20px;padding:40px 32px;font-family:system-ui,-apple-system,sans-serif;color:#1c1b18;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="https://thesift.space/sift-logo.png" alt="Sift" style="height:36px;width:auto;" />
        </div>
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:28px;font-weight:600;color:#1c1b18;margin:0 0 8px;">Welcome to Sift</h1>
          <p style="font-size:14px;color:#5e574f;margin:0;">Ready to sift your first article?</p>
        </div>

        <p style="font-size:15px;color:#5e574f;margin:0 0 24px;line-height:1.6;">
          Hi @${profile.username || 'reader'}, thanks for signing up. Sift helps you decide what to read and what to skip—but you haven't sifted anything yet.
        </p>
        <p style="font-size:15px;color:#5e574f;margin:0 0 16px;line-height:1.6;">
          Here's a quick way to start: <strong>paste any article URL on the <a href="https://thesift.space" style="color:#c77d5a;">home page</a></strong> and click Sift. You'll get a verdict, a summary, and a key insight in seconds.
        </p>
        <p style="font-size:15px;color:#5e574f;margin:0 0 24px;line-height:1.6;">
          If you have questions or feedback, just reply to this email—I read every one.
        </p>

        <div style="text-align:center;margin-top:28px;">
          <a href="https://thesift.space" style="display:inline-block;background:#c77d5a;color:#fff;font-size:14px;font-weight:500;text-decoration:none;padding:12px 28px;border-radius:30px;">Sift your first article</a>
        </div>

        <div style="margin-top:36px;padding-top:24px;border-top:1px solid #e8e3dd;text-align:center;">
          <p style="font-size:12px;color:#7a7268;margin:0;">Sent by Sift · <a href="https://thesift.space/settings" style="color:#c77d5a;text-decoration:none;">Manage email settings</a></p>
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
          subject: 'Ready to sift your first article?',
          htmlContent: html,
        }),
      });

      if (res.ok) {
        sent++;
        await supabaseAdmin
          .from('user_profiles')
          .update({ reengagement_sent: true })
          .eq('id', profile.id);
      } else {
        console.error('Brevo reengagement send failed:', await res.text());
      }
    } catch (e) {
      console.error(`Failed to send reengagement to ${user.email}`, e);
    }
  }

  return NextResponse.json({ sent });
}