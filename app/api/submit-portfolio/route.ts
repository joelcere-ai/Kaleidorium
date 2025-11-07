import { NextResponse } from 'next/server'
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import { validatePortfolioSubmission } from '@/lib/validation'
import { emailRateLimit } from '@/lib/rate-limit'

// Initialize the SES client
const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

export async function POST(request: Request) {
  // SECURITY: Apply rate limiting for portfolio submissions
  const rateLimitResponse = emailRateLimit(request as any);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json()

    // Validate and sanitize all inputs
    const validation = validatePortfolioSubmission(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { name, email, portfolioLink } = validation.sanitized!

    // Create email content
    const recipientEmail = process.env.ARTIST_SUBMISSION_RECIPIENT ?? 'kurator@kaleidorium.com';

    const emailParams = {
      Source: recipientEmail, // This email must be verified in SES
      Destination: {
        ToAddresses: [recipientEmail]
      },
      Message: {
        Subject: {
          Data: 'New Artist Portfolio Submission'
        },
        Body: {
          Html: {
            Data: `
              <h2>New portfolio submission from BlockMeister</h2>
              <p><strong>Artist Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Portfolio Link:</strong> <a href="${portfolioLink}">${portfolioLink}</a></p>
              <br>
              <p><em>This is an automated message from the BlockMeister platform.</em></p>
            `
          },
          Text: {
            Data: `
New portfolio submission from BlockMeister:

Artist Name: ${name}
Email: ${email}
Portfolio Link: ${portfolioLink}

This is an automated message from the BlockMeister platform.
            `
          }
        }
      }
    }

    // Send the email using SES
    const command = new SendEmailCommand(emailParams)
    await ses.send(command)

    return NextResponse.json(
      { message: 'Portfolio submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit portfolio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 