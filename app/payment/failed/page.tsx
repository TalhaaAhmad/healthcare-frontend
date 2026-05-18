'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'Payment could not be processed';
  const code = searchParams.get('code') || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F8F5] px-4 py-8">
      <div className="max-w-md w-full bg-white border border-gray-100 p-6 sm:p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-[#FCE7EC] mb-6">
          <svg
            className="h-8 w-8 text-[#E500BB]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold text-[#333333] mb-2" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
          Payment Failed
        </h1>

        <p className="text-sm sm:text-base text-[#666666] mb-2" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
          {decodeURIComponent(reason)}
        </p>

        {code && (
          <p className="text-sm text-[#6C7087] mb-6" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
            Error Code: {code}
          </p>
        )}

        <div className="space-y-3">
          <Link
            href="/patient/appointments"
            className="block w-full px-4 py-2.5 sm:py-3 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] transition-colors"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
          >
            Try Again
          </Link>

          <Link
            href="/patient/dashboard"
            className="block w-full px-4 py-2.5 sm:py-3 bg-white text-[#333333] text-xs font-bold uppercase tracking-[2px] border border-[#333333] hover:bg-[#333333] hover:text-white transition-colors"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
          If you were charged, please contact support with your transaction details.
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F2F8F5]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#001E42] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Loading...</p>
        </div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
