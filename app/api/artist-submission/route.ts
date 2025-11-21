import { NextResponse } from "next/server";
import { validatePortfolioSubmission } from '@/lib/validation';
import { emailRateLimit } from '@/lib/rate-limit';

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID || 'CRMHpV3s39teTwijy';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
const EMAILJS_GALLERY_TEMPLATE_ID = process.env.EMAILJS_GALLERY_TEMPLATE_ID || 'template_lg9e0us';
const EMAILJS_ARTIST_TEMPLATE_ID = process.env.EMAILJS_ARTIST_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAIL_RECIPIENT = process.env.ARTIST_SUBMISSION_RECIPIENT || 'kurator@kaleidorium.com';

const sanitizeOptionalText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
};

export async function POST(request: Request) {
  // SECURITY: Apply rate limiting for submissions
  const rateLimitResponse = emailRateLimit(request as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const submissionType = typeof body.type === 'string'
      ? body.type.toLowerCase() === 'gallery'
        ? 'gallery'
        : 'artist'
      : 'artist';

    const contactName = sanitizeOptionalText(body.contactName, 100);
    const message = sanitizeOptionalText(body.message, 2000);

    const validation = validatePortfolioSubmission({
      name: body.name,
      email: body.email,
      portfolioLink: body.portfolioLink ?? body.website,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Check EmailJS configuration
    if (!EMAILJS_SERVICE_ID || !EMAILJS_USER_ID) {
      console.error('EmailJS service ID or user ID is not configured.');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const templateId = submissionType === 'gallery' 
      ? EMAILJS_GALLERY_TEMPLATE_ID 
      : EMAILJS_ARTIST_TEMPLATE_ID;

    if (!templateId) {
      console.error(`EmailJS template ID for ${submissionType} is not configured.`);
      return NextResponse.json(
        { error: 'Email template not configured' },
        { status: 500 }
      );
    }

    const { name, email, portfolioLink } = validation.sanitized!;

    // Prepare template parameters for EmailJS
    const templateParams: Record<string, string> = {
      to_email: EMAIL_RECIPIENT,
      from_name: name,
      from_email: email,
      contact_name: contactName || name,
      portfolio_link: portfolioLink,
      website: portfolioLink,
      gallery_message: message || '',
      message: message || '',
      submission_type: submissionType,
    };

    // Build the request payload
    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: EMAILJS_USER_ID,
      template_params: templateParams,
    };

    // Prepare headers with Authorization if private key is available
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (EMAILJS_PRIVATE_KEY) {
      headers['Authorization'] = `Bearer ${EMAILJS_PRIVATE_KEY.trim()}`;
    }

    // Send email via EmailJS API
    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('EmailJS submission error:', errorText);
      return NextResponse.json(
        { error: 'Failed to send submission notification', details: errorText },
        { status: emailResponse.status || 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing submission:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
