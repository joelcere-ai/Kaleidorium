"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Sending password reset to:', email);
      
      // Check if Supabase is properly initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Get the current origin for the redirect URL
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback`;
      
      console.log('Using redirect URL:', redirectUrl);
      console.log('Redirect URL length:', redirectUrl.length);
      console.log('Redirect URL has spaces:', redirectUrl.includes(' '));
      console.log('Redirect URL encoded:', encodeURIComponent(redirectUrl));
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      // Try different redirect URL formats to see which one works
      const redirectOptions = [
        redirectUrl.trim(),
        `${origin}/auth/callback`,
        `${origin}/password-reset`, // Fallback to direct password reset
      ];
      
      console.log('Trying redirect options:', redirectOptions);
      
      // Try URL encoding the redirect URL to prevent spaces
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl.trim(), // Remove any potential whitespace
      });
      
      if (error) {
        console.error('Password reset error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status
        });
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        console.log('Password reset email sent successfully');
        setEmailSent(true);
        toast({
          title: "Email Sent!",
          description: "If this email is registered with us, you'll receive a password reset link shortly."
        });
        
        // Redirect to password reset page after 2 seconds
        setTimeout(() => {
          router.push('/password-reset');
        }, 2000);
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

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold mb-2">Check Your Email</h1>
              <p className="text-gray-600 mb-4">
                If this email is registered with us, you'll receive a password reset link shortly.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to password reset page...
              </p>
            </div>
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
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => router.push("/login")}
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 