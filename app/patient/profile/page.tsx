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
  if (!patient) return <p className="text-center text-gray-500 py-12">Patient not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        {!isEditing && (
          <button onClick={startEditing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input value={form.first_name || ''} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input value={form.last_name || ''} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                <select value={form.blood_group || ''} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select</option>
                  <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                  <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" value={form.dob || ''} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Allergies</label>
              <textarea value={form.allergies || ''} onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medical History</label>
              <textarea value={form.medical_history || ''} onChange={(e) => setForm({ ...form, medical_history: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} />
            </div>
            <div className="flex space-x-4">
              <button type="submit" disabled={updatePatient.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                {updatePatient.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
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
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base text-gray-900">{value || '—'}</p>
    </div>
  );
}
