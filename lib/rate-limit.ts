import { NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();

export function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.firstRequest > windowMs) {
    // Reset window
    rateLimitMap.set(key, { count: 1, firstRequest: now });
    return null; // allowed
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  record.count++;
  return null; // allowed
}