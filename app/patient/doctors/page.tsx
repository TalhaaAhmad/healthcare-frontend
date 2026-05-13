'use client';

import { useDoctorList } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DoctorsPage() {
  const { data, isLoading } = useDoctorList();
  const doctors = data?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Our Doctors</h1>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : doctors.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No doctors found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor: any) => (
            <div key={doctor.name} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <div className="px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
                    {doctor.image ? (
                      <img src={doctor.image} alt={doctor.practitioner_name}
                        className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center text-3xl">👨‍⚕️</div>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{doctor.practitioner_name}</h3>
                <p className="text-sm text-blue-600 font-medium">{doctor.designation}</p>
                <p className="text-sm text-gray-500 mt-1">{doctor.department}</p>
                {doctor.bio && <p className="text-sm text-gray-600 mt-3 line-clamp-3">{doctor.bio}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    doctor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>{doctor.status}</span>
                  <a href="/patient/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
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
