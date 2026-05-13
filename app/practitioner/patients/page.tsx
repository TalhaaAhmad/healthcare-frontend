'use client';

import { useState } from 'react';
import { useFrappeList, useFrappeGetOne } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const { data, isLoading } = useFrappeList('Patient', searchTerm
    ? [['patient_name', 'like', `%${searchTerm}%`]] : undefined);

  const { data: patientDetail, isLoading: detailLoading } = useFrappeGetOne('Patient', selectedPatient || '');
  const { data: historyData } = useFrappeList('Patient Encounter', [['patient', '=', selectedPatient || '']]);

  const patients = data?.data || [];
  const patient = patientDetail?.data;
  const history = historyData?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Patients</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <input type="text" placeholder="Search patients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-4" />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {isLoading ? <LoadingSpinner className="py-8" /> :
             patients.length === 0 ? <p className="px-4 py-8 text-center text-gray-500">No patients found</p> :
             patients.map((p: any) => (
               <button key={p.name} onClick={() => setSelectedPatient(p.name)}
                 className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                   selectedPatient === p.name ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                 }`}>
                 <p className="font-medium text-gray-900">{p.patient_name}</p>
                 <p className="text-sm text-gray-500">{p.mobile}</p>
               </button>
             ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedPatient ? (
            detailLoading ? <LoadingSpinner className="py-12" /> :
            patient ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-gray-500">Patient ID</p><p className="font-medium">{patient.name}</p></div>
                    <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{patient.patient_name}</p></div>
                    <div><p className="text-sm text-gray-500">Sex</p><p className="font-medium">{patient.sex}</p></div>
                    <div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium">{patient.dob}</p></div>
                    <div><p className="text-sm text-gray-500">Blood Group</p><p className="font-medium">{patient.blood_group || '—'}</p></div>
                    <div><p className="text-sm text-gray-500">Mobile</p><p className="font-medium">{patient.mobile}</p></div>
                  </div>
                  {patient.allergies && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm font-medium text-yellow-800">Allergies: {patient.allergies}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultation History</h2>
                  {history.length === 0 ? <p className="text-gray-500">No previous consultations</p> : (
                    <div className="space-y-3">
                      {history.map((enc: any) => (
                        <div key={enc.name} className="p-3 bg-gray-50 rounded">
                          <div className="flex justify-between">
                            <p className="font-medium">{enc.encounter_date}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              enc.status === 'Closed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>{enc.status}</span>
                          </div>
                          {enc.diagnosis?.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Diagnosis: {enc.diagnosis.map((d: any) => d.diagnosis).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Select a patient to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
