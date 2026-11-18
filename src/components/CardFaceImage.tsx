'use client';

import Image from 'next/image';

type CardFaceImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Parent already has aspect + position:relative — only render fill image */
  embedded?: boolean;
};

const DEFAULT_SIZES =
  '(max-width: 640px) 45vw, (max-width: 1024px) 22vw, (max-width: 1280px) 16vw, 12vw';

/**
 * Trading-card aspect image. Uses an inner absolute wrapper so Next `fill` works
 * inside CSS grid/flex (avoids 0×0 renders from global img rules).
 */
export function CardFaceImage({
  src,
  alt,
  className = 'object-cover',
  sizes = DEFAULT_SIZES,
  priority = false,
  embedded = false,
}: CardFaceImageProps) {
  const image = (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      decoding="async"
    />
  );

  if (embedded) {
    return <div className="absolute inset-0">{image}</div>;
  }

  return (
    <div className="relative aspect-[63/88] w-full min-h-0">
      <div className="absolute inset-0">{image}</div>
    </div>
  );
}