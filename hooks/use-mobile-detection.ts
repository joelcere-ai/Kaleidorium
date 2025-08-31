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

export function useMobileDetection(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLandscape: false,
    isPortrait: true,
    screenWidth: 0,
    screenHeight: 0,
  });

  useEffect(() => {
    const checkDevice = () => {
      // Screen dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Device type detection
      const isMobileWidth = width < 768;
      const isTabletWidth = width >= 768 && width < 1024;
      
      // User agent detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Touch capability detection
      const hasTouchCapability = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Orientation detection
      const isLandscape = width > height;
      const isPortrait = height >= width;
      
      // Combine detections
      const isMobile = isMobileWidth && (isMobileUserAgent || hasTouchCapability);
      const isTablet = (isTabletWidth && (isMobileUserAgent || hasTouchCapability)) || 
                      (userAgent.includes('ipad') || (userAgent.includes('macintosh') && hasTouchCapability));
      const isDesktop = !isMobile && !isTablet;

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        isPortrait,
        screenWidth: width,
        screenHeight: height,
      });
    };

    // Initial check
    checkDevice();

    // Listen for resize and orientation change events
    const handleResize = () => {
      checkDevice();
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(checkDevice, 100);
    };

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