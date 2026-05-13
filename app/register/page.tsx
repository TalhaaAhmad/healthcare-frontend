'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    password: '',
    sex: 'Male',
    dob: '',
    blood_group: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create User first (with password)
      const userRes = await fetch('/api/frappe/resource/User', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          send_welcome_email: 0,
          user_type: 'Website User',
          roles: [{ role: 'Patient' }],
          new_password: form.password,
        }),
      });

      if (!userRes.ok && userRes.status !== 409) {
        const err = await userRes.json();
        setError(err.error || 'User creation failed');
        return;
      }

      // 2. Create Patient linked to the User
      const patientRes = await fetch('/api/frappe/resource/Patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          patient_name: `${form.first_name} ${form.last_name}`,
          status: 'Active',
          user_id: form.email,
        }),
      });

      if (!patientRes.ok) {
        const err = await patientRes.json();
        setError(err.error || 'Registration failed');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F8F5] py-12 px-4">
        <div className="max-w-md w-full p-8 bg-white border border-gray-100 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#F2F8F5] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#001E42]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-[#001E42] mb-4" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Registration Successful!</h2>
          <p className="text-[#666666] mb-6" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Your account has been created. You can now log in.</p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] transition-colors"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F8F5] py-12 px-4">
      <div className="max-w-lg w-full space-y-8 p-8 bg-white border border-gray-100">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Zan Center"
            width={64}
            height={64}
            className="mx-auto mb-4 object-contain"
          />
          <h2 className="text-center text-3xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Zan Center</h2>
          <p className="mt-2 text-center text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Create your patient account</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-[#FCE7EC] border border-[#E500BB]/20 text-[#001E42] px-4 py-3 text-sm" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>First Name</label>
              <input name="first_name" required value={form.first_name} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Last Name</label>
              <input name="last_name" required value={form.last_name} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
              style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Mobile</label>
            <input name="mobile" required value={form.mobile} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
              style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Sex</label>
              <select name="sex" value={form.sex} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Date of Birth</label>
              <input name="dob" type="date" required value={form.dob} onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Blood Group</label>
            <select name="blood_group" value={form.blood_group} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
              style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }}>
              <option value="">Select</option>
              <option value="A Positive">A+</option>
              <option value="A Negative">A-</option>
              <option value="B Positive">B+</option>
              <option value="B Negative">B-</option>
              <option value="AB Positive">AB+</option>
              <option value="AB Negative">AB-</option>
              <option value="O Positive">O+</option>
              <option value="O Negative">O-</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>Password</label>
            <input name="password" type="password" required value={form.password} onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
              style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 px-4 border border-transparent text-xs font-bold uppercase tracking-[2px] text-white bg-[#001E42] hover:bg-[#002a5c] focus:outline-none disabled:opacity-50 transition-colors"
            style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif", borderRadius: 0 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
            Already have an account?{' '}
            <Link href="/login" className="text-[#E500BB] hover:text-[#001E42] font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
