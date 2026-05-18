'use client';

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="animate-spin h-8 w-8 border-2 border-[#001E42] border-t-transparent"></div>
    </div>
  );
}
