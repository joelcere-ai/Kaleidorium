"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { verifyOTP, generateOTP, storeOTP, cleanupExpiredOTPs } from "@/lib/otp-service";
import { sendPasswordResetOTP } from "@/lib/emailjs";

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkOTPRequest = () => {
      try {
        console.log('Checking OTP verification request...');
        
        // Check if user has a recent OTP request
        const otpEmail = sessionStorage.getItem('otpVerificationEmail');
        const otpRequested = sessionStorage.getItem('otpRequested');
        
        if (!otpEmail || !otpRequested) {
          console.log('No OTP request found');
          toast({
            title: "Invalid Access",
            description: "Please request a password reset first.",
            variant: "destructive"
          });
          router.push('/forgot-password');
          return;
        }
        
        const requestTime = parseInt(otpRequested);
        const now = Date.now();
        const timeDiff = now - requestTime;
        const isValidTimeframe = timeDiff < 600000; // 10 minutes
        
        console.log('OTP request check:', {
          email: otpEmail,
          timeDiff,
          isValidTimeframe
        });
        
        if (!isValidTimeframe) {
          console.log('OTP request expired');
          sessionStorage.removeItem('otpVerificationEmail');
          sessionStorage.removeItem('otpRequested');
          toast({
            title: "Request Expired",
            description: "Your verification request has expired. Please request a new one.",
            variant: "destructive"
          });
          router.push('/forgot-password');
          return;
        }
        
        setEmail(otpEmail);
        setIsValidSession(true);
        console.log('OTP verification session valid');
        
      } catch (err) {
        console.error('Error checking OTP request:', err);
        toast({
          title: "Error",
          description: "An error occurred while checking your verification request.",
          variant: "destructive"
        });
        router.push('/forgot-password');
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkOTPRequest();
  }, [router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Verifying OTP:', otp);
      
      // Verify the OTP using our custom service
      const result = await verifyOTP(email, otp);
      
      if (!result.valid) {
        console.error('OTP verification failed:', result.message);
        toast({
          title: "Invalid Code",
          description: result.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log('OTP verified successfully');
      
      // Clear OTP data
      sessionStorage.removeItem('otpVerificationEmail');
      sessionStorage.removeItem('otpRequested');
      
      // Store verification success
      sessionStorage.setItem('passwordResetVerified', 'true');
      sessionStorage.setItem('verifiedEmail', email);
      
      toast({
        title: "Email Verified!",
        description: "Your email has been verified. You can now reset your password."
      });
      
      // Redirect to password reset page
      router.push('/password-reset');
      
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    
    try {
      console.log('Resending OTP to:', email);
      
      // Generate new OTP
      const otp = generateOTP();
      const otpStored = await storeOTP(email, otp);
      
      if (!otpStored) {
        toast({
          title: "Error",
          description: "Failed to generate new verification code. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Send OTP email using EmailJS
      const emailSent = await sendPasswordResetOTP(email, otp);
      
      if (!emailSent) {
        toast({
          title: "Error",
          description: "Failed to resend verification code. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('OTP resent successfully');
      sessionStorage.setItem('otpRequested', Date.now().toString());
      
      // Clean up expired OTPs
      await cleanupExpiredOTPs();
      
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email."
      });
    } catch (err) {
      console.error('Unexpected error resending OTP:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking verification request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4 text-red-600">Invalid Access</h1>
            <p className="mb-4 text-gray-600">
              Please request a password reset first.
            </p>
            <Button onClick={() => router.push('/forgot-password')}>
              Go to Password Reset
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please enter the code below to continue with your password reset.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block mb-1 font-medium">
              Verification Code
            </label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
              disabled={loading}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify Code"}
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={handleResendOTP}
              disabled={loading}
              className="text-sm"
            >
              Didn't receive the code? Resend
            </Button>
          </div>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => router.push("/forgot-password")}
              className="text-sm"
            >
              Back to Password Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
