'use client';

import { useState } from 'react';
import { useFrappeGetOne, useFrappeUpdate } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';

export default function PatientProfile() {
  const { patientId } = useAuth();
  const { data, isLoading } = useFrappeGetOne('Patient', patientId || '');
  const updatePatient = useFrappeUpdate('Patient');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const patient = data?.data;

  function startEditing() {
    setForm({ ...patient });
    setIsEditing(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) return;
    await updatePatient.mutateAsync({ name: patientId, data: form });
    setIsEditing(false);
  }

  if (isLoading) return <LoadingSpinner className="py-12" />;
  if (!patient) return <p className="text-center text-[#6C7087] py-12" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Patient not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        {!isEditing && (
          <button onClick={startEditing}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#E500BB] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#c400a0] transition-colors"
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 p-4 sm:p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>First Name</label>
                <input value={form.first_name || ''} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                  style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Last Name</label>
                <input value={form.last_name || ''} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                  style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Mobile</label>
                <input value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                  style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Email</label>
                <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                  style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Blood Group</label>
                <select value={form.blood_group || ''} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                  style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}>
                  <option value="">Select</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Date of Birth</label>
                <input type="date" value={form.dob || ''} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                  style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Allergies</label>
              <textarea value={form.allergies || ''} onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Medical History</label>
              <textarea value={form.medical_history || ''} onChange={(e) => setForm({ ...form, medical_history: e.target.value })}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} rows={3} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
              <button type="submit" disabled={updatePatient.isPending}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#E500BB] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#c400a0] disabled:opacity-50 transition-colors"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                {updatePatient.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-[#333333] text-xs font-bold uppercase tracking-[2px] border border-[#333333] hover:bg-[#333333] hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Patient ID" value={patient.name} />
              <InfoItem label="Full Name" value={patient.patient_name} />
              <InfoItem label="Sex" value={patient.sex} />
              <InfoItem label="Date of Birth" value={patient.dob} />
              <InfoItem label="Blood Group" value={patient.blood_group} />
              <InfoItem label="Mobile" value={patient.mobile} />
              <InfoItem label="Email" value={patient.email} />
              <InfoItem label="Status" value={patient.status} />
            </div>
            <InfoItem label="Allergies" value={patient.allergies} />
            <InfoItem label="Medical History" value={patient.medical_history} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Emergency Contact" value={patient.emergency_contact_name} />
              <InfoItem label="Emergency Number" value={patient.emergency_contact_number} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{label}</p>
      <p className="text-base text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{value || '—'}</p>
    </div>
  );
}
