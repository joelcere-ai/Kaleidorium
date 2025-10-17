"use client";

import React from 'react';

interface FoundingArtistBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FoundingArtistBadge({ className = '', size = 'sm' }: FoundingArtistBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  return (
    <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <svg 
        viewBox="0 0 24 24" 
        className={`${sizeClasses[size]} text-black`}
        fill="currentColor"
        aria-label="Founding Artist Badge"
      >
        {/* Star/burst shape with checkmark */}
        <path 
          d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z"
          fill="currentColor"
        />
        {/* Checkmark overlay */}
        <path 
          d="M9 12L11 14L15 10"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// Alternative simpler badge with just a checkmark in a circle
export function SimpleFoundingArtistBadge({ className = '', size = 'sm' }: FoundingArtistBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className={`${sizeClasses[size]} bg-black rounded-full flex items-center justify-center`}>
        <svg 
          viewBox="0 0 24 24" 
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Founding Artist"
        >
          <path d="M9 12L11 14L15 10" />
        </svg>
      </div>
    </div>
  );
}
