import Image from 'next/image';
import { ImageOff } from 'lucide-react';

interface ThumbnailProps {
  src: string | null | undefined;
  alt?: string;
  size?: number; // width & height in pixels
  className?: string;
}

export default function Thumbnail({ src, alt = '', size = 80, className = '' }: ThumbnailProps) {
  if (src) {
    return (
      <div
        className={`overflow-hidden bg-surface-700 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    );
  }

  // Fallback – warm gradient with subtle icon
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-accent-400/20 to-surface-700 ${className}`}
      style={{ width: size, height: size }}
    >
      <ImageOff className="text-surface-400" size={size * 0.35} />
    </div>
  );
}