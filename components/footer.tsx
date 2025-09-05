import React from "react";

export function Footer() {
  return (
    <footer className="w-full py-4 border-t bg-background text-center text-base text-foreground">
      <div className="container mx-auto flex flex-col sm:flex-row justify-center gap-4">
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-base text-foreground font-normal"
        >
          Terms of Service
        </a>
        <span className="hidden sm:inline text-base text-foreground">|</span>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-base text-foreground font-normal"
        >
          Privacy & Data Policy
        </a>
      </div>
    </footer>
  );
} 