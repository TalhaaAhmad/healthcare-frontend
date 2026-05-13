import { NextRequest, NextResponse } from 'next/server';
import { getFrappeServerClient } from '@/lib/frappe-client';

/**
 * Lookup a user's linked Patient and/or Healthcare Practitioner records.
 * Uses API Key auth (not cookie auth) because the logged-in user may not
 * have permission to read these DocTypes via the REST API.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let patientId = null;
    let practitionerId = null;

    // Lookup Patient by email — fetch multiple possible ID fields
    try {
      const patientRes = await getFrappeServerClient().get(
        `/resource/Patient?fields=["name","patient_name","email","mobile"]&filters=[["email","=","${email}"]]`
      );
      console.log('[Lookup] Patient search by email:', email, 'result:', JSON.stringify(patientRes.data));
      if (patientRes.data?.data?.length > 0) {
        const patient = patientRes.data.data[0];
        // Use 'name' (doc ID) as patientId — this is what other DocTypes reference
        patientId = patient.name;
        console.log('[Lookup] Selected patientId:', patientId, 'from patient:', patient);
      }
    } catch (err: any) {
      console.log('[Lookup] Patient search failed:', err.response?.data || err.message);
    }

    // Lookup Healthcare Practitioner by user_id
    try {
      const practRes = await getFrappeServerClient().get(
        `/resource/Healthcare%20Practitioner?fields=["name"]&filters=[["user_id","=","${email}"]]`
      );
      console.log('[Lookup] Practitioner search by user_id:', email, 'result:', JSON.stringify(practRes.data));
      if (practRes.data?.data?.length > 0) {
        practitionerId = practRes.data.data[0].name;
      }
    } catch (err: any) {
      console.log('[Lookup] Practitioner search failed:', err.response?.data || err.message);
    }

    // Fallback: if role suggests Patient but no record found, try by owner
    if (!patientId) {
      try {
        const fallbackRes = await getFrappeServerClient().get(
          `/resource/Patient?fields=["name"]&filters=[["owner","=","${email}"]]`
        );
        if (fallbackRes.data?.data?.length > 0) {
          patientId = fallbackRes.data.data[0].name;
        }
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({ patientId, practitionerId });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Lookup failed', detail: error.message },
      { status: 500 }
    );
  }
}
