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
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkPasswordResetSession = async () => {
      try {
        console.log('Checking password reset session...');
        console.log('Current URL:', window.location.href);

        // Wait a moment for the session to be set by the auth callback
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if we have an active Supabase session (set by auth callback)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Session check:', {
          hasSession: !!session,
          sessionError: error?.message,
          user: session?.user?.email
        });

        if (session && session.user) {
          console.log('Valid password reset session detected for user:', session.user.email);
          setIsValidSession(true);
        } else {
          console.log('No valid session found - checking URL parameters as fallback...');
          
          // Fallback: check for tokens in URL (hash or query params)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);
          
          const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
          const type = hashParams.get('type') || queryParams.get('type');
          const token = hashParams.get('token') || queryParams.get('token');

          console.log('URL fallback check:', {
            accessToken: !!accessToken,
            type,
            token: !!token,
            hash: window.location.hash,
            search: window.location.search
          });

          if ((type === 'recovery' && accessToken) || (type === 'recovery' && token)) {
            console.log('Found recovery tokens in URL, allowing password reset');
            setIsValidSession(true);
          } else {
            console.log('No valid password reset session or tokens found');
            toast({
              title: "Invalid Reset Link",
              description: "This password reset link is invalid or has expired. Please request a new one.",
              variant: "destructive"
            });
            setTimeout(() => {
              router.push('/forgot-password');
            }, 3000);
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        toast({
          title: "Error",
          description: "An error occurred while checking your reset link.",
          variant: "destructive"
        });
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkPasswordResetSession();
  }, [router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to update password...');
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('Password update error:', error);
        setError(error.message);
      } else {
        console.log('Password updated successfully');
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4 text-red-600">Invalid Reset Link</h1>
            <p className="mb-4 text-gray-600">
              This password reset link is invalid or has expired.
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Redirecting to request a new reset link...
            </p>
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
                <p><strong>Debug Info:</strong></p>
                <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
                <p>Hash: {typeof window !== 'undefined' ? window.location.hash : 'N/A'}</p>
                <p>Search: {typeof window !== 'undefined' ? window.location.search : 'N/A'}</p>
                <button 
                  onClick={() => {
                    console.log('Manual auth callback test...');
                    window.location.href = '/auth/callback?token=test&type=recovery';
                  }}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Test Auth Callback
                </button>
              </div>
            )}
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
              minLength={6}
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
              minLength={6}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
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