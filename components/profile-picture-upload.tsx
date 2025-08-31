"use client"

import { useState, useRef } from "react"
import { Camera, X, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { validateImageFile, validateSecureImageFile, optimizeImageForProfile, type OptimizedImage } from "@/lib/image-utils"
import { useToast } from "@/hooks/use-toast"

interface ProfilePictureUploadProps {
  onImageSelect: (optimizedImage: OptimizedImage | null) => void;
  currentImage?: string | null;
  disabled?: boolean;
  enableSecureScan?: boolean; // Enable advanced security scanning
}

export function ProfilePictureUpload({ 
  onImageSelect, 
  currentImage, 
  disabled = false, 
  enableSecureScan = true 
}: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let validatedFile = file;

    try {
      if (enableSecureScan) {
        // SECURITY: Advanced secure validation with malware scanning
        setIsScanning(true);
        
        toast({
          title: "Scanning file...",
          description: "Running security checks on your image.",
        });

        const secureValidation = await validateSecureImageFile(file);
        if (!secureValidation.valid || !secureValidation.sanitizedFile) {
          toast({
            title: "Security check failed",
            description: secureValidation.error || "File failed security validation",
            variant: "destructive",
          });
          return;
        }
        
        validatedFile = secureValidation.sanitizedFile;
        
        toast({
          title: "Security check passed",
          description: "File is safe and ready for processing.",
        });
      } else {
        // Legacy validation (deprecated)
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast({
            title: "Invalid image",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }
      }

      setIsOptimizing(true);

      // Optimize image
      const optimizedImage = await optimizeImageForProfile(validatedFile);
      
      // Set preview
      setPreview(optimizedImage.dataUrl);
      
      // Notify parent component
      onImageSelect(optimizedImage);

      toast({
        title: "Image ready!",
        description: enableSecureScan 
          ? "Profile picture has been scanned, validated, and optimized for upload."
          : "Profile picture has been optimized and is ready to upload.",
      });
    } catch (error) {
      console.error("Image processing failed:", error);
      toast({
        title: "Processing failed",
        description: "Failed to process the image. Please try a different file.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
      setIsScanning(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="relative">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Profile preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div 
              onClick={handleClick}
              className={`w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'
              } transition-colors`}
            >
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center mt-4">
          <Button
            type="button"
            size="sm"
            onClick={handleClick}
            disabled={disabled || isOptimizing || isScanning}
          >
            {isScanning ? (
              <>
                <Shield className="w-4 h-4 mr-2 animate-spin" />
                "Scanning for threats..."
              </>
            ) : isOptimizing ? (
              "Optimizing..."
            ) : preview ? (
              "Change Picture"
            ) : (
              "Upload Profile Picture"
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p>JPG, PNG, GIF, or WebP • Max 5MB</p>
            {enableSecureScan && (
              <p className="flex items-center justify-center text-blue-600">
                <Shield className="w-3 h-3 mr-1" />
                Advanced security scanning enabled
              </p>
            )}
            {preview && (
              <p className="text-green-600 flex items-center justify-center">
                ✓ Image validated and optimized
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 