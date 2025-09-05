"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { validateEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter your email address.", 
        variant: "destructive" 
      });
      return;
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      toast({ 
        title: "Error", 
        description: emailValidation.error || "Please enter a valid email address.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Sending password reset to:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) {
        console.error('Password reset error:', error);
        toast({ 
          title: "Error", 
          description: error.message, 
          variant: "destructive" 
        });
      } else {
        console.log('Password reset email sent successfully');
        setSubmitted(true);
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

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4 text-green-600">Check Your Email</h1>
            <p className="mb-4 text-gray-600">
              If an account with the email <strong>{email}</strong> exists, you will receive a password reset link shortly.
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Please check your inbox and spam folder. The email may take a few minutes to arrive.
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.push("/login")} className="w-full">
                Back to Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }} 
                className="w-full"
              >
                Send Another Reset Link
              </Button>
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
          <h1 className="text-2xl font-semibold mb-2">Forgot Your Password?</h1>
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
              placeholder="Enter your email address"
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </Button>
          
          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => router.push("/login")}
              className="text-sm"
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 