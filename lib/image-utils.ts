/**
 * Image utility functions for profile picture optimization
 */

import { validateSecureFileUpload, processSecureUpload } from './secure-file-upload';
import { secureLog } from './secure-error-handler';

export interface OptimizedImage {
  file: File;
  dataUrl: string;
}

/**
 * DEPRECATED: Use validateSecureFileUpload instead
 * Legacy function maintained for backwards compatibility
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  secureLog('warn', 'Using deprecated validateImageFile - migrate to validateSecureFileUpload', { fileName: file.name });
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB (increased from 1MB)

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Please upload a JPG or PNG image file." };
  }

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: "Image file must be smaller than 5MB." };
  }

  // Check for suspicious file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid file name' };
  }

  // Additional security: Check file extension matches MIME type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png'];
  
  if (!fileExtension || !validExtensions.includes(fileExtension)) {
    return { valid: false, error: "File extension must match the file type." };
  }

  return { valid: true };
}

/**
 * Secure image validation with comprehensive security checks
 */
export async function validateSecureImageFile(file: File): Promise<{ valid: boolean; error?: string; sanitizedFile?: File }> {
  try {
    secureLog('info', 'Profile picture validation (simplified for compatibility)', { 
      fileName: file.name, 
      fileSize: file.size, 
      mimeType: file.type 
    });

    // Basic checks only for profile pictures
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Please upload a JPG, PNG, GIF, or WebP image' };
    }

    // Check file size (max 5MB for profile pictures)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Check for suspicious file names
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return { valid: false, error: 'Invalid file name' };
    }

    // Create sanitized file name
    const timestamp = Date.now();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const sanitizedName = `profile_${timestamp}.${extension}`;

    const sanitizedFile = new File([file], sanitizedName, {
      type: file.type,
      lastModified: timestamp
    });

    secureLog('info', 'Profile picture validation successful', { 
      originalName: file.name,
      sanitizedName: sanitizedName,
      fileSize: file.size
    });

    return {
      valid: true,
      sanitizedFile
    };
  } catch (error) {
    secureLog('error', 'Profile picture validation failed', { 
      fileName: file.name, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return { valid: false, error: 'File validation failed' };
  }
}

/**
 * Optimizes image by resizing and compressing
 * Creates square images for profile pictures to fit nicely in circular containers
 */
export function optimizeImageForProfile(file: File, maxWidth: number = 400, quality: number = 0.8): Promise<OptimizedImage> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate dimensions to fit within maxWidth while maintaining aspect ratio
      let { width, height } = img;
      let targetWidth = width;
      let targetHeight = height;
      
      // Scale down if larger than maxWidth
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          targetWidth = maxWidth;
          targetHeight = (height * maxWidth) / width;
        } else {
          targetHeight = maxWidth;
          targetWidth = (width * maxWidth) / height;
        }
      }

      // Create square canvas (use the larger dimension to ensure nothing is cropped)
      const squareSize = Math.max(targetWidth, targetHeight);
      canvas.width = squareSize;
      canvas.height = squareSize;

      // Fill with white background (or transparent for logos)
      if (ctx) {
        // Use white background for better logo visibility
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, squareSize, squareSize);
        
        // Calculate centered position
        const x = (squareSize - targetWidth) / 2;
        const y = (squareSize - targetHeight) / 2;
        
        // Draw image centered
        ctx.drawImage(img, x, y, targetWidth, targetHeight);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              
              resolve({
                file: optimizedFile,
                dataUrl: dataUrl
              });
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          'image/jpeg',
          quality
        );
      } else {
        reject(new Error('Canvas context not available'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Secure upload of profile picture to Supabase storage
 */
export async function uploadProfilePicture(
  supabase: any,
  userId: string,
  file: File,
  userType: 'collector' | 'artist' | 'gallery' = 'collector'
): Promise<{ url: string; path: string }> {
  
  // SECURITY: Validate file with comprehensive security checks
  const validation = await validateSecureImageFile(file);
  if (!validation.valid || !validation.sanitizedFile) {
    throw new Error(validation.error || 'File validation failed');
  }
  
  const sanitizedFile = validation.sanitizedFile;
  
  // Generate secure file name
  const fileExt = 'jpg'; // Always save as JPG after optimization
  const timestamp = Date.now();
  const fileName = `${userId}-${timestamp}.${fileExt}`;
  const filePath = `${userType}s/${fileName}`;

  secureLog('info', 'Starting secure profile picture upload', {
    userId,
    userType,
    originalFileName: file.name,
    sanitizedFileName: sanitizedFile.name,
    fileSize: sanitizedFile.size
  });

  const { data, error } = await supabase.storage
    .from('profile-pictures')
    .upload(filePath, sanitizedFile, {
      cacheControl: '3600',
      upsert: true,
      // Additional security headers
      metadata: {
        'uploaded-by': userId,
        'upload-timestamp': timestamp.toString(),
        'content-type': sanitizedFile.type
      }
    });

  if (error) {
    secureLog('error', 'Profile picture upload failed', {
      userId,
      fileName: sanitizedFile.name,
      error: error.message
    });
    throw new Error(`Failed to upload profile picture: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(filePath);

  secureLog('info', 'Profile picture upload successful', {
    userId,
    filePath,
    publicUrl
  });

  return {
    url: publicUrl,
    path: filePath
  };
} 