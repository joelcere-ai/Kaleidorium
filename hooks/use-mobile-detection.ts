'use client';

import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
}

function computeDetection(): MobileDetection {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true, isLandscape: false, isPortrait: true, screenWidth: 0, screenHeight: 0 };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobileWidth = width < 768;
  const isTabletWidth = width >= 768 && width < 1024;
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const hasTouchCapability = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isLandscape = width > height;
  const isPortrait = height >= width;
  const isMobile = isMobileWidth && (isMobileUserAgent || hasTouchCapability);
  const isTablet = (isTabletWidth && (isMobileUserAgent || hasTouchCapability)) ||
                   (userAgent.includes('ipad') || (userAgent.includes('macintosh') && hasTouchCapability));
  const isDesktop = !isMobile && !isTablet;
  return { isMobile, isTablet, isDesktop, isLandscape, isPortrait, screenWidth: width, screenHeight: height };
}

export function useMobileDetection(): MobileDetection {
  // Initialise immediately from window so the correct header renders on the very first paint —
  // no useEffect delay means no flash of the wrong (desktop) header on mobile.
  const [detection, setDetection] = useState<MobileDetection>(() => computeDetection());

  useEffect(() => {
    const checkDevice = () => setDetection(computeDetection());

    // Initial check (catches any mismatch from SSR)
    checkDevice();

    // Listen for resize and orientation change events
    const handleResize = () => checkDevice();
    const handleOrientationChange = () => setTimeout(checkDevice, 100);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return detection;
} 