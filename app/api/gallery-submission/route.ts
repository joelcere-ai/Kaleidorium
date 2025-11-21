import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { validatePortfolioSubmission } from '@/lib/validation';
import { emailRateLimit } from '@/lib/rate-limit';

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

    const { name, email, portfolioLink } = validation.sanitized!;
    const contactName = body.contactName || '';
    const message = body.message || '';

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn("Gallery submission email credentials are not configured. Submission will be logged but no email sent.", {
        hasEmailUser: Boolean(emailUser),
        hasEmailPassword: Boolean(emailPassword)
      });

      return NextResponse.json({
        success: true,
        message: "Submission received (email notifications not configured)."
      });
    }

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Email content
    const recipientEmail = process.env.ARTIST_SUBMISSION_RECIPIENT ?? 'kurator@kaleidorium.com';
    const mailOptions = {
      from: emailUser,
      to: recipientEmail,
      subject: "New Gallery Submission",
      text: `
        New gallery submission received:
        
        Gallery Name: ${name}
        Contact Name: ${contactName}
        Email: ${email}
        Website: ${portfolioLink}
        Message: ${message}
        
        Please review this submission at your earliest convenience.
      `,
      html: `
        <h2>New Gallery Submission</h2>
        <p><strong>Gallery Name:</strong> ${name}</p>
        <p><strong>Contact Name:</strong> ${contactName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Website:</strong> <a href="${portfolioLink}">${portfolioLink}</a></p>
        ${message ? `<p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
        <p>Please review this submission at your earliest convenience.</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing gallery submission:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}

