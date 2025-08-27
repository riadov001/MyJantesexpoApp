import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface PhotoPickerProps {
  selectedPhotos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export default function PhotoPicker({ selectedPhotos, onPhotosChange }: PhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        try {
          const base64 = await fileToBase64(file);
          newPhotos.push(base64);
        } catch (error) {
          console.error("Error converting file to base64:", error);
        }
      }
    }

    onPhotosChange([...selectedPhotos, ...newPhotos]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = selectedPhotos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-ios p-6 text-center">
        <Camera className="text-3xl text-muted mb-3 mx-auto" size={48} />
        <p className="text-sm text-muted-foreground mb-3">
          Ajoutez des photos pour une meilleure estimation
        </p>
        <Button
          type="button"
          className="ios-button px-4 py-2 text-sm"
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-select-photos"
        >
          Sélectionner des photos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          data-testid="input-file-photos"
        />
      </div>

      {selectedPhotos.length > 0 && (
        <div className="photo-grid">
          {selectedPhotos.map((photo, index) => (
            <div key={index} className="relative group" data-testid={`photo-preview-${index}`}>
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-20 object-cover rounded-ios"
              />
              <button
                type="button"
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs"
                onClick={() => removePhoto(index)}
                data-testid={`button-remove-photo-${index}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
