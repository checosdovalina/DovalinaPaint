import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onChange: (files: string[]) => void;
  value: string[];
  label: string;
  className?: string;
  multiple?: boolean;
}

export function ImageUpload({ 
  onChange, 
  value = [], 
  label, 
  className,
  multiple = true 
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImages, setPreviewImages] = useState<string[]>(value || []);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const newPreviewImages: string[] = [];

    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const base64String = event.target.result;
          newPreviewImages.push(base64String);
          
          // If we've processed all files, update state and call onChange
          if (newPreviewImages.length === filesArray.length) {
            const updatedPreviews = multiple 
              ? [...previewImages, ...newPreviewImages] 
              : newPreviewImages;
            
            setPreviewImages(updatedPreviews);
            onChange(updatedPreviews);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const updatedPreviews = [...previewImages];
    updatedPreviews.splice(index, 1);
    setPreviewImages(updatedPreviews);
    onChange(updatedPreviews);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-medium text-sm">{label}</p>
      
      <div className="flex flex-wrap gap-3 mt-2">
        {previewImages.map((src, index) => (
          <div 
            key={index} 
            className="relative w-24 h-24 border rounded-md overflow-hidden group"
          >
            <img 
              src={src} 
              alt={`Preview ${index}`} 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      
      <div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          multiple={multiple}
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleClick}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          <span>{previewImages.length > 0 ? "Add more images" : "Upload images"}</span>
        </Button>
      </div>
    </div>
  );
}