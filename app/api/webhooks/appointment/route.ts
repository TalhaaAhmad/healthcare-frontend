import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getFrappeServerClient } from '@/lib/frappe-client';
import {
  notifyAppointmentBooked,
  notifyDoctorNewAppointment,
} from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Invalidate caches
    revalidateTag('appointments', 'default');

    // Send notification to doctor when appointment is created/updated via webhook
    const doc = payload.data || payload.doc || {};
    const practitionerId = doc.practitioner;
    const appointmentId = doc.name;

    if (practitionerId && appointmentId) {
      try {
        const frappe = getFrappeServerClient();

        // Look up doctor email
        let doctorEmail = '';
        try {
          const pracRes = await frappe.get(`/resource/Healthcare Practitioner/${practitionerId}`);
          doctorEmail = pracRes.data?.data?.user_id || pracRes.data?.data?.email || '';
        } catch { /* non-critical */ }

        // Look up patient email for booking confirmation
        let patientEmail = '';
        if (doc.patient) {
          try {
            const patRes = await frappe.get(`/resource/Patient/${doc.patient}`);
            patientEmail = patRes.data?.data?.email || patRes.data?.data?.user_id || '';
          } catch { /* non-critical */ }
        }

        // Notify doctor of new appointment
        if (doctorEmail) {
          notifyDoctorNewAppointment(
            doctorEmail,
            appointmentId,
            doc.patient_name || '',
            doc.department || '',
            doc.appointment_date || '',
            doc.appointment_time || ''
          ).catch(() => {});
        }

        // Notify patient of appointment (if not already done via payment flow)
        if (patientEmail) {
          notifyAppointmentBooked(
            patientEmail,
            appointmentId,
            doc.practitioner_name || '',
            doc.department || '',
            doc.appointment_date || '',
            doc.appointment_time || ''
          ).catch(() => {});
        }
      } catch (notifError: any) {
        console.error('[Webhook] Notification error (non-critical):', notifError?.message);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
