import { NextRequest, NextResponse } from 'next/server';
import { getFrappeServerClient } from '@/lib/frappe-client';

/**
 * Create a Patient record for a relative (no User account created).
 * The Patient's user_id is set to the booking user's email, linking
 * the relative's patient record to the account holder.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      sex,
      dob,
      blood_group,
      mobile,
      user_id, // booking user's email
    } = body;

    if (!first_name || !last_name || !sex || !dob || !mobile || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const frappe = getFrappeServerClient();
    const patientName = `${first_name} ${last_name}`;

    // Check if a patient with the same name + mobile already exists
    // to avoid duplicates when the same relative is booked multiple times
    try {
      const existingRes = await frappe.get(
        `/resource/Patient?fields=["name","patient_name","mobile"]&filters=[["patient_name","=","${patientName}"],["mobile","=","${mobile}"]]`
      );
      if (existingRes.data?.data?.length > 0) {
        const existing = existingRes.data.data[0];
        console.log('[Create Relative] Found existing patient:', existing.name);
        return NextResponse.json({
          success: true,
          patientId: existing.name,
          patientName: existing.patient_name,
          existing: true,
        });
      }
    } catch (lookupErr: any) {
      console.log('[Create Relative] Duplicate check failed, proceeding with creation:', lookupErr.message);
    }

    // Create the Patient record
    const patientRes = await frappe.post('/resource/Patient', {
      first_name,
      last_name,
      patient_name: patientName,
      sex,
      dob,
      blood_group: blood_group || undefined,
      mobile,
      status: 'Active',
      user_id, // links to booking user, no separate User created
    });

    const createdPatient = patientRes.data?.data;
    const patientId = createdPatient?.name;

    if (!patientId) {
      throw new Error('Patient creation returned no document ID');
    }

    console.log('[Create Relative] Created patient:', patientId);

    return NextResponse.json({
      success: true,
      patientId,
      patientName: createdPatient?.patient_name || patientName,
      existing: false,
    });
  } catch (error: any) {
    console.error('[Create Relative] Error:', error?.response?.data || error.message);
    return NextResponse.json(
      {
        error: 'Failed to create relative patient',
        detail: error?.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}
