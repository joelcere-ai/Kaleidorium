import { NextResponse } from "next/server";
import { validatePortfolioSubmission } from '@/lib/validation';
import { emailRateLimit } from '@/lib/rate-limit';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_RECIPIENT = process.env.ARTIST_SUBMISSION_RECIPIENT || 'kurator@kaleidorium.com';
const EMAIL_FROM = process.env.SENDGRID_FROM_EMAIL || EMAIL_RECIPIENT;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

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

    if (!SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not configured. Submission email cannot be sent.');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const { name, email, portfolioLink } = validation.sanitized!;
    const subject = submissionType === 'gallery'
      ? 'New Gallery Submission'
      : 'New Artist Portfolio Submission';

    const linkLabel = submissionType === 'gallery' ? 'Website' : 'Portfolio Link';

    const textBody = `
New ${submissionType} submission received.

Name: ${name}
${contactName ? `Contact Name: ${contactName}\n` : ''}Email: ${email}
${linkLabel}: ${portfolioLink}
${message ? `\nMessage:\n${message}` : ''}
`.trim();

    const htmlBody = `
      <h2>New ${submissionType === 'gallery' ? 'Gallery' : 'Artist'} Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      ${contactName ? `<p><strong>Contact Name:</strong> ${contactName}</p>` : ''}
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>${linkLabel}:</strong> <a href="${portfolioLink}">${portfolioLink}</a></p>
      ${message ? `<p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
    `;

    try {
      await sgMail.send({
        to: EMAIL_RECIPIENT,
        from: EMAIL_FROM,
        replyTo: email || EMAIL_FROM,
        subject,
        text: textBody,
        html: htmlBody,
      });
    } catch (emailError: any) {
      console.error('SendGrid submission error:', emailError?.response?.body || emailError);
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
