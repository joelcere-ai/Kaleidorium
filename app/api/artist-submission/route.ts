import { NextResponse } from "next/server";
import { validatePortfolioSubmission } from '@/lib/validation';
import { emailRateLimit } from '@/lib/rate-limit';

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_za8v4ih';
const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID || 'CRMHpV3s39teTwijy';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
const EMAILJS_ARTIST_TEMPLATE_ID = process.env.EMAILJS_ARTIST_TEMPLATE_ID;
const EMAILJS_GALLERY_TEMPLATE_ID = process.env.EMAILJS_GALLERY_TEMPLATE_ID || 'template_lg9e0us';
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

    if (!EMAILJS_PRIVATE_KEY) {
      console.error('EMAILJS_PRIVATE_KEY is not configured. Email cannot be sent.');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const { name, email, portfolioLink } = validation.sanitized!;
    const templateId = submissionType === 'gallery'
      ? EMAILJS_GALLERY_TEMPLATE_ID
      : EMAILJS_ARTIST_TEMPLATE_ID || EMAILJS_GALLERY_TEMPLATE_ID;

    const emailResponse = await fetch(EMAILJS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMAILJS_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: EMAILJS_USER_ID,
        template_params: {
          to_email: EMAIL_RECIPIENT,
          submission_type: submissionType,
          from_name: name,
          contact_name: contactName,
          from_email: email,
          portfolio_link: portfolioLink,
          gallery_message: message,
        },
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('EmailJS submission error:', errorText);
      return NextResponse.json(
        { error: 'Failed to send submission notification' },
        { status: 502 }
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
