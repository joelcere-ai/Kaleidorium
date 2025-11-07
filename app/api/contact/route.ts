import { NextRequest, NextResponse } from 'next/server';
import { emailRateLimit } from '@/lib/rate-limit';
import { SecureErrors, secureLog } from '@/lib/secure-error-handler';

export async function POST(req: NextRequest) {
  // SECURITY: Apply rate limiting for contact form
  const rateLimitResponse = emailRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { email, subject, message } = await req.json();
    secureLog('info', 'Contact form submission received', { hasEmail: !!email, hasSubject: !!subject });
    
    if (!email || !subject || !message) {
      return SecureErrors.validation('All fields are required');
    }
    
    // Send email via EmailJS
    secureLog('info', 'Attempting to send contact email');
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_za8v4ih',
        template_id: 'template_kziu70q',
        user_id: 'CRMHpV3s39teTwijy',
        template_params: {
          to_email: 'kurator@kaleidorium.com',
          from_email: email,
          subject,
          message,
        },
      }),
    });
    
    if (!res.ok) {
      secureLog('error', 'EmailJS service error', { status: res.status });
      return SecureErrors.external('Email service');
    }
    
    secureLog('info', 'Contact email sent successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    return SecureErrors.server({ operation: 'contact_form' });
  }
} 