import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

interface ServiceImageUploadProps {
  currentImage?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  label: string;
  hint: string;
  uploadingLabel: string;
  errorFormat: string;
  errorSize: string;
  errorGeneric: string;
}

export function ServiceImageUpload({
  currentImage,
  onUpload,
  onRemove,
  label,
  hint,
  uploadingLabel,
  errorFormat,
  errorSize,
  errorGeneric,
}: ServiceImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setError(errorFormat);
      return;
    }
    if (file.size > maxSize) {
      setError(errorSize);
      return;
    }

    const priorPreview = preview;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsLoading(true);
    try {
      await onUpload(file);
    } catch (err) {
      console.error('Service image upload error:', err);
      setError(errorGeneric);
      setPreview(priorPreview);
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError('');
    onRemove?.();
  };

  return (
    <div className="card-surface p-5">
      <label className="block text-sm font-semibold text-navy mb-1.5">{label}</label>
      <p className="text-xs text-muted-foreground mb-3">{hint}</p>

      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        className="relative w-full aspect-video rounded-xl border-2 border-dashed border-border overflow-hidden cursor-pointer group bg-muted/40 hover:border-brand transition-colors"
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {isLoading ? (
                <Loader2 size={28} className="text-white animate-spin" />
              ) : (
                <ImagePlus size={28} className="text-white" />
              )}
            </div>
            {!isLoading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                aria-label="Remove"
              >
                <X size={14} />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {isLoading ? (
              <Loader2 size={28} className="animate-spin text-brand" />
            ) : (
              <ImagePlus size={28} />
            )}
            <span className="text-xs font-medium">{isLoading ? uploadingLabel : label}</span>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

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
