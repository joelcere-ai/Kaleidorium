import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { validatePortfolioSubmission } from '@/lib/validation';
import { emailRateLimit } from '@/lib/rate-limit';

const hasSesCredentials =
  Boolean(process.env.AWS_REGION) &&
  Boolean(process.env.AWS_ACCESS_KEY_ID) &&
  Boolean(process.env.AWS_SECRET_ACCESS_KEY);

const ses = hasSesCredentials
  ? new SESClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })
  : null;

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

    if (!ses) {
      console.warn("Submission SES credentials are not configured. Submission logged but no email sent.", {
        hasRegion: Boolean(process.env.AWS_REGION),
        hasAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
        hasSecret: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
      });

      return NextResponse.json({
        success: true,
        message: "Submission received (email notifications not configured)."
      });
    }

    const { name, email, portfolioLink } = validation.sanitized!;
    const recipientEmail = process.env.ARTIST_SUBMISSION_RECIPIENT ?? 'kurator@kaleidorium.com';
    const sourceEmail = process.env.SES_SOURCE_EMAIL || recipientEmail;
    const replyToAddresses = email ? [email] : [];

    const subject = submissionType === 'gallery'
      ? "New Gallery Submission"
      : "New Artist Portfolio Submission";

    const linkLabel = submissionType === 'gallery' ? 'Website' : 'Portfolio Link';

    const textBody = `
New ${submissionType} submission received:

Name: ${name}
${contactName ? `Contact Name: ${contactName}\n` : ''}Email: ${email}
${linkLabel}: ${portfolioLink}
${message ? `\nMessage:\n${message}\n` : ''}
Please review this submission at your earliest convenience.
`.trim();

    const htmlBody = `
      <h2>New ${submissionType === 'gallery' ? 'Gallery' : 'Artist'} Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      ${contactName ? `<p><strong>Contact Name:</strong> ${contactName}</p>` : ''}
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>${linkLabel}:</strong> <a href="${portfolioLink}">${portfolioLink}</a></p>
      ${message ? `<p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
      <p>Please review this submission at your earliest convenience.</p>
    `;

    const emailParams = {
      Source: sourceEmail,
      Destination: { ToAddresses: [recipientEmail] },
      ...(replyToAddresses.length ? { ReplyToAddresses: replyToAddresses } : {}),
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: textBody },
          Html: { Data: htmlBody },
        },
      },
    };

    await ses.send(new SendEmailCommand(emailParams));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing submission:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
