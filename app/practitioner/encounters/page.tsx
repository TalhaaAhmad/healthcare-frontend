'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFrappeGetOne, useFrappeCreate } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';

export default function EncountersPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-12" />}>
      <EncountersForm />
    </Suspense>
  );
}

function EncountersForm() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patient') || '';
  const appointmentId = searchParams.get('appointment') || '';

  const { practitionerId, user } = useAuth();
  const safePractitionerId = practitionerId || '';
  const practitionerName = user?.full_name || '';

  const { data: patientData, isLoading: patientLoading } = useFrappeGetOne('Patient', patientId);
  const createEncounter = useFrappeCreate('Patient Encounter');

  const patient = patientData?.data;

  const [symptoms, setSymptoms] = useState([{ complaint: '', duration: '', severity: '' }]);
  const [diagnosis, setDiagnosis] = useState([{ diagnosis: '', type: 'Provisional' }]);
  const [drugs, setDrugs] = useState([{ drug_code: '', drug_name: '', dosage: '', period: '', dosage_form: '' }]);
  const [labTests, setLabTests] = useState([{ test_code: '', test_name: '', comments: '' }]);
  const [vitalSigns, setVitalSigns] = useState({ bp: '', heart_rate: '', temperature: '', respiratory_rate: '', weight: '', height: '' });
  const [notes, setNotes] = useState('');

  function addSymptom() { setSymptoms([...symptoms, { complaint: '', duration: '', severity: '' }]); }
  function addDiagnosis() { setDiagnosis([...diagnosis, { diagnosis: '', type: 'Provisional' }]); }
  function addDrug() { setDrugs([...drugs, { drug_code: '', drug_name: '', dosage: '', period: '', dosage_form: '' }]); }
  function addLabTest() { setLabTests([...labTests, { test_code: '', test_name: '', comments: '' }]); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    await createEncounter.mutateAsync({
      patient: patientId, patient_name: patient.patient_name,
      practitioner: safePractitionerId, practitioner_name: practitionerName,
      appointment: appointmentId,
      encounter_date: new Date().toISOString().split('T')[0],
      encounter_time: new Date().toTimeString().split(' ')[0],
      department: patient.department || 'General',
      status: 'Open',
      symptoms: symptoms.filter(s => s.complaint),
      diagnosis: diagnosis.filter(d => d.diagnosis),
      drug_prescription: drugs.filter(d => d.drug_code),
      lab_test_prescription: labTests.filter(l => l.test_code),
      vital_signs: vitalSigns,
      notes,
    });
  }

  if (!patientId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Select a patient from the Appointments or Patients page to start a consultation.</p>
        </div>
      </div>
    );
  }

  if (patientLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
        {patient && (
          <div className="text-right">
            <p className="font-medium text-gray-900">{patient.patient_name}</p>
            <p className="text-sm text-gray-500">{patient.name} | {patient.sex} | {patient.dob}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(vitalSigns).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</label>
                <input value={value} onChange={(e) => setVitalSigns({ ...vitalSigns, [key]: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Symptoms</h2>
            <button type="button" onClick={addSymptom} className="text-sm text-blue-600 hover:text-blue-700">+ Add Symptom</button>
          </div>
          <div className="space-y-3">
            {symptoms.map((s, i) => (
              <div key={i} className="grid grid-cols-3 gap-3">
                <input placeholder="Complaint" value={s.complaint}
                  onChange={(e) => { const newS = [...symptoms]; newS[i].complaint = e.target.value; setSymptoms(newS); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <input placeholder="Duration" value={s.duration}
                  onChange={(e) => { const newS = [...symptoms]; newS[i].duration = e.target.value; setSymptoms(newS); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <input placeholder="Severity" value={s.severity}
                  onChange={(e) => { const newS = [...symptoms]; newS[i].severity = e.target.value; setSymptoms(newS); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Diagnosis</h2>
            <button type="button" onClick={addDiagnosis} className="text-sm text-blue-600 hover:text-blue-700">+ Add Diagnosis</button>
          </div>
          <div className="space-y-3">
            {diagnosis.map((d, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <input placeholder="Diagnosis" value={d.diagnosis}
                  onChange={(e) => { const newD = [...diagnosis]; newD[i].diagnosis = e.target.value; setDiagnosis(newD); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <select value={d.type}
                  onChange={(e) => { const newD = [...diagnosis]; newD[i].type = e.target.value; setDiagnosis(newD); }}
                  className="px-3 py-2 border border-gray-300 rounded-md">
                  <option>Provisional</option><option>Final</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Drug Prescription</h2>
            <button type="button" onClick={addDrug} className="text-sm text-blue-600 hover:text-blue-700">+ Add Drug</button>
          </div>
          <div className="space-y-3">
            {drugs.map((d, i) => (
              <div key={i} className="grid grid-cols-5 gap-3">
                <input placeholder="Drug Code" value={d.drug_code}
                  onChange={(e) => { const newD = [...drugs]; newD[i].drug_code = e.target.value; setDrugs(newD); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <input placeholder="Drug Name" value={d.drug_name}
                  onChange={(e) => { const newD = [...drugs]; newD[i].drug_name = e.target.value; setDrugs(newD); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <input placeholder="Dosage" value={d.dosage}
                  onChange={(e) => { const newD = [...drugs]; newD[i].dosage = e.target.value; setDrugs(newD); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <input placeholder="Period" value={d.period}
                  onChange={(e) => { const newD = [...drugs]; newD[i].period = e.target.value; setDrugs(newD); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <input placeholder="Form" value={d.dosage_form}
                  onChange={(e) => { const newD = [...drugs]; newD[i].dosage_form = e.target.value; setDrugs(newD); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lab Tests</h2>
            <button type="button" onClick={addLabTest} className="text-sm text-blue-600 hover:text-blue-700">+ Add Lab Test</button>
          </div>
          <div className="space-y-3">
            {labTests.map((l, i) => (
              <div key={i} className="grid grid-cols-3 gap-3">
                <input placeholder="Test Code" value={l.test_code}
                  onChange={(e) => { const newL = [...labTests]; newL[i].test_code = e.target.value; setLabTests(newL); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <input placeholder="Test Name" value={l.test_name}
                  onChange={(e) => { const newL = [...labTests]; newL[i].test_name = e.target.value; setLabTests(newL); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
                <input placeholder="Comments" value={l.comments}
                  onChange={(e) => { const newL = [...labTests]; newL[i].comments = e.target.value; setLabTests(newL); }}
                  className="px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes</h2>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter clinical notes..." />
        </div>

        <button type="submit" disabled={createEncounter.isPending}
          className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50">
          {createEncounter.isPending ? 'Saving...' : 'Save Consultation'}
        </button>
      </form>
    </div>
  );
}
