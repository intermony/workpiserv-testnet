import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string;
  username: string;
  displayName: string;
  onUpload: (file: File) => Promise<void>;
}

export function AvatarUpload({ currentAvatar, username, displayName, onUpload }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert('Format non supporté (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > maxSize) {
      alert('Fichier trop volumineux (max 2MB)');
      return;
    }

    // Preview locale immédiate
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload API
    setIsLoading(true);
    try {
      await onUpload(file);
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert("Erreur lors de l'upload");
      setPreview(currentAvatar || null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => !isLoading && inputRef.current?.click()}>
      {preview ? (
        <img
          src={preview}
          alt={displayName}
          className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg"
        />
      ) : (
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-brand flex items-center justify-center">
          <span className="text-white font-bold text-4xl">{getInitial(username)}</span>
        </div>
      )}

      {/* Overlay hover */}
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <Camera className="w-8 h-8 text-white" />
        )}
      </div>

      {/* Badge online */}
      <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />
    </div>
  );
      }
    
