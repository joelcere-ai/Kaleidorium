"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkPasswordResetRequest = async () => {
      try {
        console.log('Checking password reset request...');
        console.log('Current URL:', window.location.href);
        
        // Check URL parameters for password reset token
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');
        
        console.log('URL parameters:', { token: !!token, type });
        
        if (type === 'recovery' && token) {
          console.log('Password reset token found in URL');
          
          // Verify the token with Supabase
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (error) {
            console.error('Token verification error:', error);
            toast({
              title: "Invalid Link",
              description: "This password reset link is invalid or has expired.",
              variant: "destructive"
            });
            router.push('/forgot-password');
            return;
          }
          
          if (data.session && data.user) {
            console.log('Password reset token verified for user:', data.user.email);
            setEmail(data.user.email || '');
            setIsValidSession(true);
            
            // Store verification success
            sessionStorage.setItem('passwordResetVerified', 'true');
            sessionStorage.setItem('verifiedEmail', data.user.email || '');
            
            // Redirect to password reset page
            setTimeout(() => {
              router.push('/password-reset');
            }, 2000);
          } else {
            console.log('Token verified but no session created');
            toast({
              title: "Verification Failed",
              description: "Email verification failed. Please try again.",
              variant: "destructive"
            });
            router.push('/forgot-password');
          }
        } else {
          // Check if user has a recent password reset request
          const resetEmail = sessionStorage.getItem('passwordResetEmail');
          const resetRequested = sessionStorage.getItem('passwordResetRequested');
          
          if (!resetEmail || !resetRequested) {
            console.log('No password reset request found');
            toast({
              title: "Invalid Access",
              description: "Please request a password reset first.",
              variant: "destructive"
            });
            router.push('/forgot-password');
            return;
          }
          
          const requestTime = parseInt(resetRequested);
          const now = Date.now();
          const timeDiff = now - requestTime;
          const isValidTimeframe = timeDiff < 600000; // 10 minutes
          
          console.log('Password reset request check:', {
            email: resetEmail,
            timeDiff,
            isValidTimeframe
          });
          
          if (!isValidTimeframe) {
            console.log('Password reset request expired');
            sessionStorage.removeItem('passwordResetEmail');
            sessionStorage.removeItem('passwordResetRequested');
            toast({
              title: "Request Expired",
              description: "Your password reset request has expired. Please request a new one.",
              variant: "destructive"
            });
            router.push('/forgot-password');
            return;
          }
          
          setEmail(resetEmail);
          setIsValidSession(true);
          console.log('Password reset session valid');
        }
        
      } catch (err) {
        console.error('Error checking password reset request:', err);
        toast({
          title: "Error",
          description: "An error occurred while checking your password reset request.",
          variant: "destructive"
        });
        router.push('/forgot-password');
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkPasswordResetRequest();
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
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email'
      });
      
      if (error) {
        console.error('OTP verification error:', error);
        toast({
          title: "Invalid Code",
          description: "The verification code is invalid or has expired. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (data.session) {
        console.log('OTP verified successfully, session created');
        
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
      } else {
        console.log('OTP verified but no session created');
        toast({
          title: "Verification Failed",
          description: "Email verification failed. Please try again.",
          variant: "destructive"
        });
      }
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
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false
        }
      });
      
      if (error) {
        console.error('Resend OTP error:', error);
        toast({
          title: "Error",
          description: "Failed to resend verification code. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log('OTP resent successfully');
        sessionStorage.setItem('otpRequested', Date.now().toString());
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your email."
        });
      }
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
          <h1 className="text-2xl font-semibold mb-2">Password Reset Link Sent</h1>
          <p className="text-gray-600">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please check your email and click the link to continue with your password reset.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Waiting for you to click the email link...</p>
          </div>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => router.push("/forgot-password")}
              className="text-sm"
            >
              Request New Reset Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
