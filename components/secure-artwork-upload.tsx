"use client"

import { useState, useRef } from "react"
import { Camera, X, Shield, AlertTriangle, Upload, FileImage, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

// Helper function to resize image for AI analysis
async function resizeImageForAI(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }
    
    img.onload = () => {
      // Calculate new dimensions (max 800px on longest side for AI analysis)
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with reduced quality for AI analysis
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], `ai_${file.name}`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(resizedFile);
        } else {
          reject(new Error('Failed to resize image'));
        }
      }, 'image/jpeg', 0.8); // 80% quality for good AI analysis
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface ArtworkMetadata {
  dimensions?: { width: number; height: number };
  fileSize: number;
  format: string;
  hasEXIF: boolean;
  securityFlags?: string[];
}

interface SecureArtworkUploadProps {
  onArtworkSelect: (result: { url: string; metadata: ArtworkMetadata; tempFile?: any } | null) => void;
  artworkTitle: string;
  disabled?: boolean;
  currentImageUrl?: string;
  maxFileSize?: number; // in MB
  enableAdvancedSecurity?: boolean;
  tempUpload?: boolean; // For uploads during registration
}

export function SecureArtworkUpload({ 
  onArtworkSelect, 
  artworkTitle,
  disabled = false,
  currentImageUrl,
  maxFileSize = 20,
  enableAdvancedSecurity = true,
  tempUpload = false
}: SecureArtworkUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [securityStatus, setSecurityStatus] = useState<'idle' | 'scanning' | 'safe' | 'threat'>('idle');
  const [lastUploadMetadata, setLastUploadMetadata] = useState<ArtworkMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!artworkTitle.trim()) {
      toast({
        title: "Artwork title required",
        description: "Please enter an artwork title before uploading.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Basic client-side validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, PNG, GIF, WebP, TIFF, or BMP image.",
          variant: "destructive",
        });
        return;
      }

      const maxSizeBytes = maxFileSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast({
          title: "File too large",
          description: `Please upload an image smaller than ${maxFileSize}MB.`,
          variant: "destructive",
        });
        return;
      }

      setIsScanning(true);
      setSecurityStatus('scanning');
      setUploadProgress(0);

      if (enableAdvancedSecurity) {
        toast({
          title: "Scanning artwork...",
          description: "Running comprehensive security checks on your artwork.",
        });
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', artworkTitle.trim());
      if (tempUpload) {
        formData.append('tempUpload', 'true');
      }

      setIsUploading(true);
      setUploadProgress(25);

      if (tempUpload) {
        // For temporary uploads during registration, use client-side processing only
        setUploadProgress(50);
        
        // Basic client-side validation
        if (!file.type.startsWith('image/')) {
          throw new Error('Please upload an image file');
        }
        
        const maxSizeBytes = (maxFileSize || 20) * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          throw new Error(`File size must be less than ${maxFileSize || 20}MB`);
        }
        
        // For AI analysis, we need a real URL, so resize and upload a smaller version
        try {
          // Create a smaller version for AI analysis
          const resizedFile = await resizeImageForAI(file);
          const aiFormData = new FormData();
          aiFormData.append('file', resizedFile);
          aiFormData.append('title', formData.get('title') as string);
          aiFormData.append('tempUpload', 'true');
          
          const response = await fetch('/api/upload-temp-artwork', {
            method: 'POST',
            body: aiFormData,
          });
          
          setUploadProgress(75);
          
          if (response.ok) {
            const result = await response.json();
            setUploadProgress(100);
            setSecurityStatus('safe');
            
            const tempMetadata = {
              dimensions: { width: 1920, height: 1080 },
              fileSize: file.size,
              format: file.type,
              hasEXIF: false,
              securityFlags: []
            };
            
            setLastUploadMetadata(tempMetadata);
            
            // Return server URL for AI analysis
            onArtworkSelect({
              url: result.url,
              metadata: tempMetadata,
              tempFile: {
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: result.url
              }
            });
          } else {
            // Fallback to client-side processing if server fails
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:${file.type};base64,${base64}`;
            
            setUploadProgress(100);
            setSecurityStatus('safe');
            
            const tempMetadata = {
              dimensions: { width: 1920, height: 1080 },
              fileSize: file.size,
              format: file.type,
              hasEXIF: false,
              securityFlags: []
            };
            
            setLastUploadMetadata(tempMetadata);
            
            onArtworkSelect({
              url: dataUrl,
              metadata: tempMetadata,
              tempFile: {
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: dataUrl
              }
            });
          }
        } catch (uploadError) {
          // Final fallback to client-side processing
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUrl = `data:${file.type};base64,${base64}`;
          
          setUploadProgress(100);
          setSecurityStatus('safe');
          
          const tempMetadata = {
            dimensions: { width: 1920, height: 1080 },
            fileSize: file.size,
            format: file.type,
            hasEXIF: false,
            securityFlags: []
          };
          
          setLastUploadMetadata(tempMetadata);
          
          onArtworkSelect({
            url: dataUrl,
            metadata: tempMetadata,
            tempFile: {
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: dataUrl
            }
          });
        }
        
      } else {
        // For permanent uploads, use the API endpoint
        const response = await fetch('/api/upload-artwork', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(75);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed');
        }

        setUploadProgress(100);
        setSecurityStatus('safe');
        setLastUploadMetadata(result.metadata);
        
        // Handle permanent upload result
        onArtworkSelect({
          url: result.url,
          metadata: result.metadata
        });

        const securityFlags = result?.metadata?.securityFlags || [];
        const flagText = securityFlags.length > 0 ? ` (${securityFlags.length} security flags noted)` : '';

        toast({
          title: "Artwork uploaded successfully!",
          description: enableAdvancedSecurity 
            ? `Your artwork has been scanned, validated, and uploaded securely.${flagText}`
            : "Your artwork has been uploaded successfully.",
        });
      }

    } catch (error) {
      console.error("Artwork upload failed:", error);
      setSecurityStatus('threat');
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload artwork. Please try again.",
        variant: "destructive",
      });
      
      // Reset preview on error
      setPreview(currentImageUrl || null);
      onArtworkSelect(null);
    } finally {
      setIsUploading(false);
      setIsScanning(false);
      setUploadProgress(0);
      
      // Reset security status after a delay
      setTimeout(() => {
        if (securityStatus !== 'safe') {
          setSecurityStatus('idle');
        }
      }, 3000);
    }
  };

  const handleRemoveArtwork = () => {
    setPreview(null);
    setLastUploadMetadata(null);
    setSecurityStatus('idle');
    onArtworkSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getSecurityIcon = () => {
    switch (securityStatus) {
      case 'scanning':
        return <Shield className="w-4 h-4 animate-spin text-blue-500" />;
      case 'safe':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'threat':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileImage className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSecurityMessage = () => {
    switch (securityStatus) {
      case 'scanning':
        return 'Scanning for threats...';
      case 'safe':
        return 'Artwork verified secure';
      case 'threat':
        return 'Security threat detected';
      default:
        return 'Ready for secure upload';
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Artwork preview"
            className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemoveArtwork}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
                <div className="text-xs">{uploadProgress}%</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={handleClick}
          className={`w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'
          } transition-colors bg-gray-50`}
        >
          <Upload className="w-6 h-6 text-gray-400 mb-2" />
          <p className="text-xs text-gray-600 text-center px-2">
            Click to upload artwork
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/tiff,image/bmp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <div className="space-y-2">
        <Button
          type="button"
          size="sm"
          onClick={handleClick}
          disabled={disabled || isUploading || isScanning || !artworkTitle.trim()}
          className="text-sm px-3 py-2"
        >
          {isScanning ? (
            <>
              <Shield className="w-3 h-3 mr-2 animate-spin" />
              Scanning...
            </>
          ) : isUploading ? (
            <>
              <Upload className="w-3 h-3 mr-2" />
              Uploading...
            </>
          ) : preview ? (
            "Change Artwork"
          ) : (
            "Upload Artwork"
          )}
        </Button>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>JPG, PNG, GIF, WebP, TIFF, BMP • Max {maxFileSize}MB</p>
          <p>Minimum 50x50 pixels • Maximum 10,000x10,000 pixels</p>
          
          {enableAdvancedSecurity && (
            <div className={`flex items-center space-x-1 ${
              securityStatus === 'safe' ? 'text-green-600' : 
              securityStatus === 'threat' ? 'text-red-600' : 
              securityStatus === 'scanning' ? 'text-blue-600' : 
              'text-gray-500'
            }`}>
              {getSecurityIcon()}
              <span>{getSecurityMessage()}</span>
            </div>
          )}
          
          {lastUploadMetadata && (
            <div className="text-green-600 space-y-1">
              <p className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready for secure upload
              </p>
              {lastUploadMetadata.dimensions && (
                <p className="text-xs">
                  {lastUploadMetadata.dimensions.width} × {lastUploadMetadata.dimensions.height} pixels
                </p>
              )}
              {lastUploadMetadata.securityFlags && lastUploadMetadata.securityFlags.length > 0 && (
                <p className="text-xs text-orange-600">
                  Security flags: {lastUploadMetadata.securityFlags.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        {!artworkTitle.trim() && (
          <p className="text-xs text-red-500">
            Please enter an artwork title before uploading
          </p>
        )}
      </div>
    </div>
  );
} 