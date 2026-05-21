// app/api/listen/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
// Use a voice that is reportedly still free on ElevenLabs free tier
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella
// Alternative free voices: 'ErXwobaYnpjKQk3XG5Zn' (Butterfly), 'TxGEqnHWrfWFTfGW9XjX' (Josh)

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2', // Use the turbo model (works on free tier)
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', errorText);
      return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
      },
    });
  } catch (err) {
    console.error('Listen error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}