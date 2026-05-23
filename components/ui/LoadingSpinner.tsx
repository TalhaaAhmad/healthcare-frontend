'use client';

import Image from 'next/image';

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-pulse">
        <Image
          src="/icon.png"
          alt="Zan Center"
          width={64}
          height={64}
          className="object-contain w-16 h-16 sm:w-20 sm:h-20"
          priority
        />
      </div>
    </div>
  );
}
