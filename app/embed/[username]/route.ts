import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = await createClient();

  // Fetch profile to check public status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, username, public_profile')
    .eq('username', username)
    .maybeSingle();

  if (!profile || !profile.public_profile) {
    return new Response(
      `console.error("Sift Embed: Profile not found or private");`,
      { headers: { 'Content-Type': 'application/javascript' } }
    );
  }

  // Generate the embed script
  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://sift-lac.vercel.app';
  const apiUrl = `${siteUrl}/api/embed/${username}`;

  const script = `
    (function() {
      const container = document.currentScript.parentElement;
      if (!container) return;
      container.innerHTML = '<div style="text-align:center; padding:20px;">Loading Sift reading list...</div>';

      fetch('${apiUrl}')
        .then(res => res.json())
        .then(data => {
          if (!data.articles || data.articles.length === 0) {
            container.innerHTML = '<div style="color: #666; padding: 20px; text-align: center;">No public articles yet.</div>';
            return;
          }
          let html = '<div style="font-family: system-ui, sans-serif;">';
          data.articles.forEach(article => {
            html += \`
              <div style="border-bottom: 1px solid #e5e5e5; padding: 12px 0;">
                <p style="margin: 0 0 4px; font-size: 14px; color: #1a1a1a;">\${article.summary.substring(0, 150)}…</p>
                <p style="margin: 0; font-size: 12px; color: #888;">
                  \${article.verdict} · \${new Date(article.created_at).toLocaleDateString()}
                </p>
              </div>
            \`;
          });
          html += \`<div style="margin-top: 12px; font-size: 12px;"><a href="${siteUrl}/profile/${username}" target="_blank">View full profile →</a></div>\`;
          html += '</div>';
          container.innerHTML = html;
        })
        .catch(err => {
          console.error('Sift embed error:', err);
          container.innerHTML = '<div style="color: red; padding: 20px;">Failed to load reading list.</div>';
        });
    })();
  `;

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}