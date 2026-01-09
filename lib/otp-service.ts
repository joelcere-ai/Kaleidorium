import { supabase } from './supabase';

export interface OTPData {
  id: string;
  email: string;
  otp: string;
  expires_at: string;
  created_at: string;
  used: boolean;
}

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in Supabase
export async function storeOTP(email: string, otp: string): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const { error } = await supabase
      .from('password_reset_otps')
      .insert({
        email,
        otp,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (error) {
      console.error('Error storing OTP:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error storing OTP:', err);
    return false;
  }
}

// Verify OTP
export async function verifyOTP(email: string, otp: string): Promise<{ valid: boolean; message: string }> {
  try {
    const { data, error } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error verifying OTP:', error);
      return { valid: false, message: 'Error verifying code. Please try again.' };
    }

    if (!data || data.length === 0) {
      return { valid: false, message: 'Invalid or expired verification code.' };
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('password_reset_otps')
      .update({ used: true })
      .eq('id', data[0].id);

    if (updateError) {
      console.error('Error marking OTP as used:', updateError);
    }

    return { valid: true, message: 'Code verified successfully.' };
  } catch (err) {
    console.error('Unexpected error verifying OTP:', err);
    return { valid: false, message: 'An unexpected error occurred. Please try again.' };
  }
}

// Clean up expired OTPs
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    const { error } = await supabase
      .from('password_reset_otps')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  } catch (err) {
    console.error('Unexpected error cleaning up OTPs:', err);
  }
}



