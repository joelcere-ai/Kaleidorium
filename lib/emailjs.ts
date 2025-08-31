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
      to_email: 'thekurator@blockmeister.com'
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