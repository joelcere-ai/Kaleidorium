import { init, send } from '@emailjs/browser';

// Initialize EmailJS
export const initEmailJS = async () => {
  try {
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (!publicKey) {
      console.error('EmailJS public key is not defined');
      return false;
    }

    init({
      publicKey,
    });
    console.log('EmailJS initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize EmailJS:', error);
    return false;
  }
};

// Send email using EmailJS
export const sendArtistSubmission = async (formData: {
  name: string;
  email: string;
  portfolioLink: string;
}) => {
  try {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error('EmailJS configuration is incomplete. Please check your environment variables.');
    }

    // Template parameters matching the EmailJS template exactly
    const templateParams = {
      name: formData.name,
      email: formData.email,
      portfolio_link: formData.portfolioLink,
      portfolioLink: formData.portfolioLink,
      artist_name: formData.name,
      from_name: formData.name,
      from_email: formData.email,
      to_email: 'kurator@kaleidorium.com'
    };

    console.log('Sending email with params:', templateParams);
    
    const response = await send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );
    
    console.log('EmailJS response:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    throw new Error('Failed to send email. Please try again later.');
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (userData: {
  name: string;
  email: string;
  userType: 'collector' | 'artist';
  firstName?: string;
  surname?: string;
}) => {
  try {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const welcomeTemplateId = process.env.NEXT_PUBLIC_EMAILJS_WELCOME_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !welcomeTemplateId || !publicKey) {
      throw new Error('EmailJS welcome email configuration is incomplete. Please check your environment variables.');
    }

    // Determine the full name
    const fullName = userData.firstName && userData.surname 
      ? `${userData.firstName} ${userData.surname}` 
      : userData.name;

    // Template parameters for welcome email
    const templateParams = {
      to_name: fullName,
      to_email: userData.email,
      user_type: userData.userType,
      first_name: userData.firstName || userData.name.split(' ')[0],
      full_name: fullName,
      from_name: 'Kaleidorium Team',
      from_email: 'kurator@kaleidorium.com',
      // Additional context for personalization
      is_artist: userData.userType === 'artist',
      is_collector: userData.userType === 'collector',
      welcome_message: userData.userType === 'artist' 
        ? 'Welcome to Kaleidorium! We\'re excited to help you share your art with collectors who will truly appreciate it.'
        : 'Welcome to Kaleidorium! Get ready to discover amazing artwork curated just for your taste.',
      next_steps: userData.userType === 'artist'
        ? 'You can now start uploading your artwork and connecting with collectors.'
        : 'Start exploring our curated collection and building your personal art collection.',
    };

    console.log('Sending welcome email with params:', {
      ...templateParams,
      to_email: '[REDACTED]' // Don't log sensitive email addresses
    });
    
    const response = await send(
      serviceId,
      welcomeTemplateId,
      templateParams,
      publicKey
    );
    
    console.log('Welcome email sent successfully:', response.status);
    return response;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
    throw new Error('Failed to send welcome email. Please try again later.');
  }
}; 