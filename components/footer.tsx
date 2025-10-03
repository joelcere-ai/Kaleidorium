"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function Footer() {
  const router = useRouter();

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/?view=terms");
  };

  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/?view=privacy");
  };

  return (
    <footer className="w-full py-4 border-t bg-background text-center text-sm text-foreground">
      <div className="container mx-auto flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={handleTermsClick}
          className="hover:underline text-sm text-foreground font-normal cursor-pointer bg-transparent border-none"
        >
          Terms of Service
        </button>
        <span className="hidden sm:inline text-sm text-foreground">|</span>
        <button
          onClick={handlePrivacyClick}
          className="hover:underline text-sm text-foreground font-normal cursor-pointer bg-transparent border-none"
        >
          Privacy & Data Policy
        </button>
      </div>
    </footer>
  );
} 