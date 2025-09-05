import React from "react";

export function Footer() {
  return (
    <footer className="w-full py-4 border-t bg-background text-center text-sm text-foreground">
      <div className="container mx-auto flex flex-col sm:flex-row justify-center gap-4">
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-sm text-foreground font-normal"
        >
          Terms of Service
        </a>
        <span className="hidden sm:inline text-sm text-foreground">|</span>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-sm text-foreground font-normal"
        >
          Privacy & Data Policy
        </a>
      </div>
    </footer>
  );
} 