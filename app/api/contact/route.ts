// app/api/contact/route.ts
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { ContactEmailTemplate } from '@/components/email/contact-email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Your Name <onboarding@resend.dev>', // You can change this
      to: ['your-email@example.com'], // Where you want to receive the emails
      subject: `New message from ${name}`,
      react: ContactEmailTemplate({ name, email, message }), // Or use 'html' for plain HTML
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}