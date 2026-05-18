import { NextRequest, NextResponse } from 'next/server';
import { getFrappeServerClient } from '@/lib/frappe-client';

/**
 * Fetch all Patient Appointment records for a user and their relatives.
 * Looks up all Patient records where user_id matches the given email,
 * then fetches all appointments for those patients.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const frappe = getFrappeServerClient();

    // 1. Find all Patient records linked to this user (self + relatives)
    const patientRes = await frappe.get(
      `/resource/Patient?fields=["name","patient_name","user_id"]&filters=[["user_id","=","${email}"]]`
    );
    const patients = patientRes.data?.data || [];

    if (patients.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Fetch appointments for all these patients
    const patientNames = patients.map((p: any) => p.name);
    const patientMap = new Map(patients.map((p: any) => [p.name, p.patient_name]));

    // Build OR filter for multiple patients
    // Frappe filter format: [["patient","in",["PAT-001","PAT-002"]]]
    const filters = [["patient", "in", patientNames]];

    const apptRes = await frappe.get('/resource/Patient Appointment', {
      params: {
        fields: JSON.stringify(['name', 'patient', 'patient_name', 'practitioner_name', 'department', 'appointment_date', 'appointment_time', 'status', 'title', 'paid_amount']),
        filters: JSON.stringify(filters),
        order_by: 'creation desc',
        limit_page_length: 50,
      },
    });

    const appointments = apptRes.data?.data || [];

    return NextResponse.json({ data: appointments });
  } catch (error: any) {
    console.error('[Patient Appointments API] Error:', error?.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch appointments', detail: error.message },
      { status: 500 }
    );
  }
}
