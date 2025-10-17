"use client";

import React, { useState, useEffect } from 'react';
import { FoundingArtistBadge } from './founding-artist-badge';
import { isFoundingArtist } from '@/lib/founding-artists';

interface ArtistNameWithBadgeProps {
  artistName: string;
  artistId?: string;
  className?: string;
  showBadge?: boolean;
}

export function ArtistNameWithBadge({ 
  artistName, 
  artistId, 
  className = '', 
  showBadge = true 
}: ArtistNameWithBadgeProps) {
  const [isFounding, setIsFounding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!artistId || !showBadge) {
      setIsFounding(false);
      return;
    }

    const checkFoundingStatus = async () => {
      setLoading(true);
      try {
        const isFoundingArtistStatus = await isFoundingArtist(artistId);
        setIsFounding(isFoundingArtistStatus);
      } catch (error) {
        console.error('Error checking founding artist status:', error);
        setIsFounding(false);
      } finally {
        setLoading(false);
      }
    };

    checkFoundingStatus();
  }, [artistId, showBadge]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span>{artistName}</span>
      {showBadge && artistId && isFounding && !loading && (
        <FoundingArtistBadge 
          size="sm" 
          className="flex-shrink-0"
          title="Founding Artist - One of the first 100 artists on Kaleidorium"
        />
      )}
    </div>
  );
}
