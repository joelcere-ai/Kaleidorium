import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { validatePortfolioSubmission } from '@/lib/validation';
import { emailRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // SECURITY: Apply rate limiting for artist submissions
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

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: 'TheKurator@blockmeister.com',
      to: 'TheKurator@blockmeister.com',
      subject: "New Artist Portfolio Submission",
      text: `
        New artist submission received:
        
        Name: ${name}
        Email: ${email}
        Portfolio Link: ${portfolioLink}
        
        Please review this submission at your earliest convenience.
      `,
      html: `
        <h2>New Artist Portfolio Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Portfolio Link:</strong> <a href="${portfolioLink}">${portfolioLink}</a></p>
        <p>Please review this submission at your earliest convenience.</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing artist submission:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
} 