'use client';

import { useDoctorList } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DoctorsPage() {
  const { data, isLoading } = useDoctorList();
  const doctors = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Our Doctors</h1>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : doctors.length === 0 ? (
        <p className="text-center text-[#6C7087] py-12" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>No doctors found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor: any) => (
            <div key={doctor.name} className="bg-white border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
              <div className="h-32 bg-[#001E42]"></div>
              <div className="px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  <div className="h-24 w-24 bg-white p-1 shadow-sm">
                    {doctor.image ? (
                      <img src={doctor.image} alt={doctor.practitioner_name}
                        className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[#F4F7FA] flex items-center justify-center text-3xl">👩‍⚕️</div>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>{doctor.practitioner_name}</h3>
                <p className="text-sm text-[#E500BB] font-medium" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{doctor.designation}</p>
                <p className="text-sm text-[#6C7087] mt-1" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{doctor.department}</p>
                {doctor.bio && <p className="text-sm text-[#666666] mt-3 line-clamp-3" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{doctor.bio}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-3 py-1 text-xs font-semibold ${
                    doctor.status === 'Active' ? 'bg-[#F2F8F5] text-[#001E42]' : 'bg-[#F4F7FA] text-[#6C7087]'
                  }`} style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{doctor.status}</span>
                  <a href="/patient/appointments" className="text-sm text-[#E500BB] hover:text-[#001E42] font-semibold transition-colors" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                    Book Appointment →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
