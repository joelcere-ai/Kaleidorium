import { NextRequest, NextResponse } from 'next/server';
import { emailRateLimit } from '@/lib/rate-limit';
import { SecureErrors, secureLog } from '@/lib/secure-error-handler';
import { validateEmail, validateName } from '@/lib/validation';
import { sendWelcomeEmail } from '@/lib/emailjs';

export async function POST(request: NextRequest) {
  // Apply rate limiting for email sending
  const rateLimitResponse = emailRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { 
      email, 
      name, 
      userType, 
      firstName, 
      surname 
    } = await request.json();

    // Validate required fields
    if (!email || !name || !userType) {
      return SecureErrors.validation('Email, name, and userType are required');
    }

    // Validate user type
    if (!['collector', 'artist'].includes(userType)) {
      return SecureErrors.validation('Invalid user type. Must be "collector" or "artist"');
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return SecureErrors.validation(emailValidation.error || 'Invalid email format');
    }

    // Validate name format
    const nameValidation = validateName(name, 'Name');
    if (!nameValidation.valid) {
      return SecureErrors.validation(nameValidation.error || 'Invalid name format');
    }

    // Optional: Validate firstName and surname if provided
    let validatedFirstName = firstName;
    let validatedSurname = surname;

    if (firstName) {
      const firstNameValidation = validateName(firstName, 'First name');
      if (!firstNameValidation.valid) {
        return SecureErrors.validation(firstNameValidation.error || 'Invalid first name format');
      }
      validatedFirstName = firstNameValidation.sanitized;
    }

    if (surname) {
      const surnameValidation = validateName(surname, 'Surname');
      if (!surnameValidation.valid) {
        return SecureErrors.validation(surnameValidation.error || 'Invalid surname format');
      }
      validatedSurname = surnameValidation.sanitized;
    }

    secureLog('info', 'Sending welcome email', {
      email: emailValidation.sanitized,
      userType,
      hasFirstName: !!firstName,
      hasSurname: !!surname
    });

    // Send welcome email
    await sendWelcomeEmail({
      name: nameValidation.sanitized!,
      email: emailValidation.sanitized!,
      userType: userType as 'collector' | 'artist',
      firstName: validatedFirstName,
      surname: validatedSurname
    });

    secureLog('info', 'Welcome email sent successfully', {
      email: emailValidation.sanitized,
      userType
    });

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error: any) {
    secureLog('error', 'Failed to send welcome email', {
      error: error.message || 'Unknown error',
      stack: error.stack
    });

    // Check if it's an EmailJS specific error
    if (error.message?.includes('EmailJS')) {
      return SecureErrors.server({ 
        operation: 'send_welcome_email',
        details: 'Email service configuration error'
      });
    }

    return SecureErrors.server({ 
      operation: 'send_welcome_email'
    });
  }
} 