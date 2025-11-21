import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { validatePortfolioSubmission } from '@/lib/validation';
import { emailRateLimit } from '@/lib/rate-limit';

// Reuse the same SES configuration as artist submissions
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

export async function POST(request: Request) {
  // SECURITY: Apply rate limiting for gallery submissions
  const rateLimitResponse = emailRateLimit(request as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Validate and sanitize all inputs
    const validation = validatePortfolioSubmission(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    if (!ses) {
      console.warn("Gallery submission SES credentials are not configured. Submission logged but no email sent.", {
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
    const contactName = body.contactName || '';
    const message = body.message || '';

    const recipientEmail = process.env.ARTIST_SUBMISSION_RECIPIENT ?? 'kurator@kaleidorium.com';
    const sourceEmail = process.env.SES_SOURCE_EMAIL || recipientEmail;

    const subject = "New Gallery Submission";
    const textBody = `
New gallery submission received:

Gallery Name: ${name}
Contact Name: ${contactName}
Email: ${email}
Website: ${portfolioLink}
Message: ${message}

Please review this submission at your earliest convenience.
`;

    const htmlBody = `
      <h2>New Gallery Submission</h2>
      <p><strong>Gallery Name:</strong> ${name}</p>
      <p><strong>Contact Name:</strong> ${contactName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Website:</strong> <a href="${portfolioLink}">${portfolioLink}</a></p>
      ${message ? `<p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
      <p>Please review this submission at your earliest convenience.</p>
    `;

    const emailParams = {
      Source: sourceEmail,
      Destination: { ToAddresses: [recipientEmail] },
      ...(email ? { ReplyToAddresses: [email] } : {}),
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
    console.error("Error processing gallery submission:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}

