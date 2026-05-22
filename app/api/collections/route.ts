import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY!;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch kept articles with summaries
  const { data: articles, error } = await supabase
    .from('sifted_articles')
    .select('id, summary')
    .eq('user_id', user.id)
    .eq('kept', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!articles || articles.length < 2) return NextResponse.json({ collections: [] });

  // Prepare summaries, truncating each to 200 chars to keep token usage low
  const summariesWithIds = articles.map(a => ({
    id: a.id,
    summary: a.summary.substring(0, 200),
  }));

  // Build prompt
  const prompt = `You are a librarian assistant. Below are summaries of articles a user has kept. Find thematic groups of at least 2 articles that are closely related. Return a JSON array of objects, each with a "title" (short, 3-5 words) and "articleIds" (array of the IDs in that group). Only include articles that clearly belong together. Do not make up groups if none exist. Return only valid JSON, no extra text.

Article summaries:
${summariesWithIds.map(a => `ID: ${a.id}\nSummary: ${a.summary}`).join('\n\n')}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You only respond with JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Groq error:', await response.text());
      return NextResponse.json({ collections: [] }, { status: 200 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();

    let collections;
    try {
      collections = JSON.parse(content);
    } catch {
      // Attempt to extract JSON from markdown
      const cleaned = content.replace(/```json\n?|```/g, '').trim();
      collections = JSON.parse(cleaned);
    }

    // Ensure we have an array
    if (!Array.isArray(collections)) collections = [];
    return NextResponse.json({ collections });
  } catch (err) {
    console.error('Collections API error:', err);
    return NextResponse.json({ collections: [] }, { status: 200 });
  }
}