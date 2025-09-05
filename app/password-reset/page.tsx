"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function PasswordResetPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have the necessary hash parameters for password reset
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    console.log('Password reset page loaded with:', {
      type,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      fullHash: window.location.hash
    });

    if (type === 'recovery' && accessToken) {
      // This is a valid password reset session
      console.log('Valid password reset session detected');
    } else {
      console.log('No valid password reset session, redirecting to login');
      toast({
        title: "Invalid Reset Link",
        description: "This password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive"
      });
      router.push('/forgot-password');
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold mb-2">Reset Your Password</h1>
          <p className="text-gray-600">
            Enter your new password below.
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