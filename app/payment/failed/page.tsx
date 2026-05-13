'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'Payment could not be processed';
  const code = searchParams.get('code') || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg
            className="h-8 w-8 text-red-600"
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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>

        <p className="text-gray-600 mb-2">
          {decodeURIComponent(reason)}
        </p>

        {code && (
          <p className="text-sm text-gray-500 mb-6">
            Error Code: {code}
          </p>
        )}

        <div className="space-y-3">
          <Link
            href="/patient/appointments"
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Try Again
          </Link>

          <Link
            href="/patient/dashboard"
            className="block w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          If you were charged, please contact support with your transaction details.
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
