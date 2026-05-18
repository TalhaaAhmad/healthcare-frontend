'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, user, isLoading, patientId } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Use patientId from auth context (set by checkSession)
      // rather than relying solely on Frappe roles
      if (patientId || user.roles?.includes('Patient')) {
        window.location.href = '/patient/dashboard';
      } else {
        window.location.href = '/';
      }
    }
  }, [isLoading, isAuthenticated, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
      return;
    }

    // Redirect will happen via useEffect after auth state updates
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F8F5] py-8 sm:py-12 px-4">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white border border-gray-100">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Zan Center"
            width={56}
            height={56}
            className="mx-auto mb-4 object-contain w-14 h-14 sm:w-16 sm:h-16"
          />
          <h2 className="text-center text-2xl sm:text-3xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
            Zan Center
          </h2>
          <p className="mt-2 text-center text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
            Sign in to your patient portal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-[#FCE7EC] border border-[#E500BB]/20 text-[#001E42] px-4 py-3 text-sm" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
              style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
              style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }}
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent text-xs font-bold uppercase tracking-[2px] text-white bg-[#001E42] hover:bg-[#002a5c] focus:outline-none disabled:opacity-50 transition-colors"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#E500BB] hover:text-[#001E42] font-semibold transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
