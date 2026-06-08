'use client';

import { useState } from 'react';
import { useFrappeGetOne, useFrappeUpdate } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';

async function changePassword(oldPassword: string, newPassword: string) {
  const res = await fetch('/api/frappe/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to change password');
  return data;
}

export default function PatientProfile() {
  const { patientId } = useAuth();
  const { data, isLoading } = useFrappeGetOne('Patient', patientId || '');
  const updatePatient = useFrappeUpdate('Patient');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  if (isLoading) return <LoadingSpinner className="py-12" />;
  if (!patient) return <p className="text-center text-[#6C7087] py-12" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Patient not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        {!isEditing && (
          <button onClick={startEditing}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] transition-colors"
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
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] disabled:opacity-50 transition-colors"
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
      {/* Change Password Section */}
      <div className="bg-white border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#001E42]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Change Password</h2>
          {!showPasswordForm && (
            <button onClick={() => { setShowPasswordForm(true); setPasswordMsg(null); }}
              className="px-4 py-2 bg-white text-[#001E42] text-xs font-bold uppercase tracking-[2px] border border-[#001E42] hover:bg-[#001E42] hover:text-white transition-colors"
              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
              Change Password
            </button>
          )}
        </div>

        {passwordMsg && (
          <div className={`mb-4 px-4 py-3 text-sm ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            {passwordMsg.text}
          </div>
        )}

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Current Password</label>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#001E42] text-sm"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
              <button type="submit" disabled={passwordLoading}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#001E42] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#002a5c] disabled:opacity-50 transition-colors"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordMsg(null); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-[#333333] text-xs font-bold uppercase tracking-[2px] border border-[#333333] hover:bg-[#333333] hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                Cancel
              </button>
            </div>
          </form>
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
