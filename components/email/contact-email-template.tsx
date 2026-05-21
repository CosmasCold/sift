// components/email/contact-email-template.tsx
import * as React from 'react';

interface ContactEmailTemplateProps {
  name: string;
  email: string;
  message: string;
}

export const ContactEmailTemplate: React.FC<Readonly<ContactEmailTemplateProps>> = ({
  name,
  email,
  message,
}) => (
  <div>
    <h1>New message from {name}</h1>
    <p>Email: {email}</p>
    <p>Message: {message}</p>
  </div>
);