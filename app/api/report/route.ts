import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const reporterId = user?.id || null;

  const { contentType, contentId, reason } = await request.json();
  if (!contentType || !contentId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { error } = await supabase.from('reported_content').insert({
    content_type: contentType,
    content_id: contentId,
    reporter_id: reporterId,
    reason: reason || '',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Email notification (optional – remove if you don't want emails)
  if (process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Sift Report <report@sift-lac.vercel.app>',
      to: process.env.CONTACT_EMAIL,
      subject: `New report: ${contentType} ${contentId}`,
      text: `A user reported a ${contentType}.\nID: ${contentId}\nReporter: ${reporterId || 'anonymous'}\nReason: ${reason || 'none'}`,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}