"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function PasswordResetPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {
        console.log('Checking password reset session...');
        console.log('Current URL:', window.location.href);

        // Check if user has completed email verification
        const isVerified = sessionStorage.getItem('passwordResetVerified');
        const email = sessionStorage.getItem('verifiedEmail');
        
        console.log('Verification check:', {
          isVerified,
          email
        });

        if (isVerified === 'true' && email) {
          console.log('Email verification completed, allowing password reset');
          setVerifiedEmail(email);
          setIsValidSession(true);
          
          // Check if we have a valid session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session && session.user) {
            console.log('Valid session found for user:', session.user.email);
          } else {
            console.log('No session found, but email is verified - allowing password reset');
          }
        } else {
          console.log('No email verification found');
          toast({
            title: "Email Verification Required",
            description: "Please verify your email address first before resetting your password.",
            variant: "destructive"
          });
          setTimeout(() => {
            router.push('/forgot-password');
          }, 3000);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        toast({
          title: "Error",
          description: "An error occurred while checking your verification status.",
          variant: "destructive"
        });
        router.push('/forgot-password');
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkPasswordResetSession();
  }, [router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('Attempting to update password...');
      
      // Check if we have a valid session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Session error. Please try requesting a new password reset.');
        return;
      }
      
      if (!session) {
        console.log('No session found, but email is verified allowing password reset');
        
        // Since we've verified the email through our custom OTP system,
        // use our API route to update the password
        const email = verifiedEmail || sessionStorage.getItem('verifiedEmail') || '';
        if (email) {
          console.log('Using verified email for password reset:', email);
          
          const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const result = await response.json();

          if (!response.ok) {
            console.error('Password reset error:', result.error);
            setError(result.error || 'Unable to reset password. Please try again.');
            return;
          }

          console.log('Password updated successfully via API');
          
          // Clear verification data
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('passwordResetVerified');
            sessionStorage.removeItem('verifiedEmail');
            sessionStorage.removeItem('otpVerificationEmail');
            sessionStorage.removeItem('otpRequested');
            console.log('Password reset data cleared');
          }
          
          toast({
            title: "Success!",
            description: "Your password has been reset successfully. You can now sign in with your new password."
          });
          router.push("/login");
          return;
        } else {
          setError('Unable to verify your identity. Please request a new password reset.');
          return;
        }
      }
      
      console.log('Session found, updating password...');
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('Password update error:', error);
        setError(error.message);
      } else {
        console.log('Password updated successfully');
        
        // Clear the verification data
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('passwordResetVerified');
          sessionStorage.removeItem('verifiedEmail');
          sessionStorage.removeItem('otpVerificationEmail');
          sessionStorage.removeItem('otpRequested');
          console.log('Password reset data cleared');
        }
        
        toast({
          title: "Success!",
          description: "Your password has been reset successfully. You can now sign in with your new password."
        });
        router.push("/login");
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError("An unexpected error occurred. Please try again.");
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
            <p className="text-gray-600">Checking verification status...</p>
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
            <h1 className="text-2xl font-semibold mb-4 text-red-600">Email Verification Required</h1>
            <p className="mb-4 text-gray-600">
              Please verify your email address first before resetting your password.
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Redirecting to password reset request...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold mb-2">Reset Your Password</h1>
          <p className="text-gray-600">
            Please enter your new password below.
          </p>
          {verifiedEmail && (
            <p className="text-sm text-gray-500 mt-2">
              Resetting password for: <strong>{verifiedEmail}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block mb-1 font-medium">
              New Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-1 font-medium">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => router.push("/forgot-password")}
              className="text-sm"
            >
              Request New Reset Link
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}