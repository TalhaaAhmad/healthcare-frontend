'use client';

import { useFrappeList, useFrappeGetOne } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';

// Separate component to fetch encounter details (avoids hooks-in-loop issue)
function EncounterDetail({ encounterName }: { encounterName: string }) {
  const { data } = useFrappeGetOne('Patient Encounter', encounterName);
  const enc = data?.data || {};

  // Fetch practitioner name separately
  const { data: practitionerData } = useFrappeGetOne('Healthcare Practitioner', enc.practitioner);
  const practitionerName = practitionerData?.data?.practitioner_name || enc.practitioner;

  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gray-900">Dr. {practitionerName}</p>
          <p className="text-sm text-gray-500">{enc.encounter_date}</p>
          {enc.symptoms?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 uppercase">Symptoms</p>
              <p className="text-sm text-gray-700">{enc.symptoms.map((s: any) => s.complaint).join(', ')}</p>
            </div>
          )}
          {enc.diagnosis?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 uppercase">Diagnosis</p>
              <p className="text-sm text-gray-700">{enc.diagnosis.map((d: any) => d.diagnosis).join(', ')}</p>
            </div>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          enc.status === 'Open' ? 'bg-blue-100 text-blue-800' :
          enc.status === 'Closed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>{enc.status}</span>
      </div>
    </div>
  );
}

// Component to fetch and display prescriptions from an encounter
function EncounterPrescriptions({ encounterName }: { encounterName: string }) {
  const { data } = useFrappeGetOne('Patient Encounter', encounterName);
  const enc = data?.data || {};
  const prescriptions = enc.drug_prescription || [];

  if (prescriptions.length === 0) return null;

  return (
    <>
      {prescriptions.map((pres: any, idx: number) => (
        <div key={`${pres.name || idx}`} className="px-6 py-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900">{pres.drug_name || pres.drug_code}</p>
            <p className="text-sm text-gray-500">{pres.dosage} | {pres.period}</p>
          </div>
          <p className="text-sm text-gray-500">{enc.encounter_date}</p>
        </div>
      ))}
    </>
  );
}

export default function MedicalRecords() {
  const { patientId } = useAuth();
  const safeId = patientId || '';

  const { data: encounterData, isLoading: encounterLoading } = useFrappeList('Patient Encounter', [
    ['patient', '=', safeId]
  ], ['name', 'practitioner', 'encounter_date', 'status']);
  const { data: labData, isLoading: labLoading } = useFrappeList('Lab Test', [
    ['patient', '=', safeId]
  ], ['name', 'template', 'date', 'status']);

  // Debug logging
  useEffect(() => {
    console.log('[MedicalRecords] encounters:', encounterData);
    console.log('[MedicalRecords] labs:', labData);
  }, [encounterData, labData]);

  const encounters = encounterData?.data || [];
  const labTests = labData?.data || [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Medical Records</h1>

      <section>
        <h2 className="text-lg font-semibold text-[#333333] mb-4" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Consultation History</h2>
        <div className="bg-white border border-gray-100 divide-y divide-gray-100">
          {encounterLoading ? <LoadingSpinner className="py-8" /> :
           encounters.length === 0 ? <p className="px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>No consultation records found</p> :
           encounters.map((enc: any) => (
             <EncounterDetail key={enc.name} encounterName={enc.name} />
           ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[#333333] mb-4" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Prescriptions</h2>
        <div className="bg-white border border-gray-100 divide-y divide-gray-100">
          {encounterLoading ? <LoadingSpinner className="py-8" /> :
           encounters.length === 0 ? <p className="px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>No prescriptions found</p> :
           encounters.map((enc: any) => (
             <EncounterPrescriptions key={`pres-${enc.name}`} encounterName={enc.name} />
           ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[#333333] mb-4" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>Lab Tests</h2>
        <div className="bg-white border border-gray-100 divide-y divide-gray-100">
          {labLoading ? <LoadingSpinner className="py-8" /> :
           labTests.length === 0 ? <p className="px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>No lab tests found</p> :
           labTests.map((test: any) => (
             <div key={test.name} className="px-6 py-4 flex justify-between items-center">
               <div>
                 <p className="font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{test.template}</p>
                 <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{test.date}</p>
               </div>
               <span className={`px-3 py-1 text-xs font-semibold ${
                 test.status === 'Completed' ? 'bg-[#F2F8F5] text-[#001E42]' :
                 test.status === 'Open' ? 'bg-[#F4F7FA] text-[#001E42]' : 'bg-[#F4F7FA] text-[#6C7087]'
               }`} style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>{test.status}</span>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
