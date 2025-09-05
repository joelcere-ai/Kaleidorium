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
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has a valid session on page load
    const checkSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('Session check:', { user: !!user, error });
      setSessionValid(!!user && !error);
      
      if (!user || error) {
        toast({
          title: "Session Expired",
          description: "Please request a new password reset link.",
          variant: "destructive"
        });
      }
    };
    
    checkSession();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast({ title: "Error", description: "Please enter and confirm your new password.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    
    try {
      // First check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({ 
          title: "Error", 
          description: "Session expired. Please request a new password reset link.", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      console.log('User authenticated, updating password...');
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('Password update error:', error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        console.log('Password updated successfully');
        toast({ title: "Success!", description: "Your password has been reset. You can now sign in with your new password." });
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      console.error('Unexpected error during password reset:', err);
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (sessionValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          <div className="text-center">Verifying session...</div>
        </div>
      </div>
    );
  }

  if (sessionValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Session Expired</h1>
          <p className="mb-4">Your password reset session has expired. Please request a new password reset link.</p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-semibold mb-4">Reset Your Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">New Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Confirm new password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
} 