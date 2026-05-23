'use client';

import { useState } from 'react';
import { useDoctorList } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

function getInitials(name: string): string {
  if (!name) return 'D';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function DoctorsPage() {
  const { data, isLoading } = useDoctorList();
  const doctors = data?.data || [];
  const [search, setSearch] = useState('');

  const filtered = doctors.filter((doctor: any) => {
    const q = search.toLowerCase();
    return (
      (doctor.practitioner_name || '').toLowerCase().includes(q) ||
      (doctor.department || '').toLowerCase().includes(q) ||
      (doctor.designation || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FCE7EC] text-[#E500BB] text-[11px] font-bold uppercase tracking-[2px] rounded-full" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E500BB]"></span>
          Premium Healthcare
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          Find Your Best <span className="text-[#E500BB]">Specialist</span>
        </h1>
        <p className="text-sm text-[#6C7087] max-w-md mx-auto" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          Book appointments with world-class practitioners and manage your healthcare journey in one place.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C7087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name or expertise..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-white text-sm text-[#333333] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E500BB] transition-colors"
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
          />
        </div>
        <button
          className="px-6 py-3 bg-[#1F2937] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#111827] transition-colors flex items-center gap-2"
          style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>

      {/* Section Title */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          Top Rated Specialists
        </h2>
        <p className="text-sm text-[#6C7087] mt-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          <span className="w-1.5 h-1.5 inline-block rounded-full bg-[#10B981] mr-1.5"></span>
          {filtered.length} active practitioner{filtered.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : filtered.length === 0 ? (
        <p className="text-center text-[#6C7087] py-12" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>No doctors found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doctor: any) => (
              <div key={doctor.name} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#F4F7FA] flex items-center justify-center overflow-hidden">
                    {doctor.image ? (
                      <img src={doctor.image} alt={doctor.practitioner_name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg sm:text-xl font-semibold text-[#9CA3AF]">{getInitials(doctor.practitioner_name)}</span>
                    )}
                  </div>
                  {doctor.status === 'Active' && (
                    <span className="absolute bottom-0 left-12 sm:left-16 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white"></span>
                  )}
                </div>

                {/* Specialty */}
                <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#E500BB] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                  {doctor.department || 'Family Medicine'}
                </p>

                {/* Name */}
                <h3 className="text-base sm:text-lg font-semibold text-[#1F2937] mb-3" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                  {doctor.practitioner_name}
                </h3>

                {/* Fee & Rating */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#9CA3AF]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Fee Starting</p>
                    <p className="text-sm font-semibold text-[#1F2937]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                      Premium
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#9CA3AF]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Rating</p>
                    <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                      <svg className="w-3.5 h-3.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      4.9
                    </p>
                  </div>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}
