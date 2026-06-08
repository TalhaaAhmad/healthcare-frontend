import { NextRequest, NextResponse } from 'next/server';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  processAppointmentReminders,
  notifyPatientRegistration,
  notifyAppointmentBooked,
  notifyPaymentConfirmed,
  notifyDoctorNewAppointment,
} from '@/lib/notifications';

/**
 * GET  /api/notifications?email=...&unreadOnly=true
 *      Fetch notifications for a user.
 *
 * POST /api/notifications
 *      Body:
 *        { action: "mark_read",      id: "NOTIF-001" }
 *        { action: "mark_all_read",  email: "user@example.com" }
 *        { action: "process_reminders" }   ← trigger reminder check (cron)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const notifications = await getUserNotifications(email, 30, unreadOnly);
    return NextResponse.json({ data: notifications });
  } catch (error: any) {
    console.error('[Notifications GET] Error:', error?.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'mark_read': {
        if (!body.id) {
          return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });
        }
        await markNotificationRead(body.id);
        return NextResponse.json({ success: true });
      }

      case 'mark_all_read': {
        if (!body.email) {
          return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }
        await markAllNotificationsRead(body.email);
        return NextResponse.json({ success: true });
      }

      case 'process_reminders': {
        const result = await processAppointmentReminders();
        return NextResponse.json({ success: true, ...result });
      }

      case 'registration_confirmation': {
        const { email, patient_name } = body;
        if (!email || !patient_name) {
          return NextResponse.json({ error: 'email and patient_name are required' }, { status: 400 });
        }
        await notifyPatientRegistration(email, patient_name);
        return NextResponse.json({ success: true });
      }

      case 'appointment_booked': {
        const { patient_email, appointment_id, practitioner_name, department, appointment_date, appointment_time, practitioner_email } = body;
        if (!patient_email || !appointment_id) {
          return NextResponse.json({ error: 'patient_email and appointment_id are required' }, { status: 400 });
        }
        // Notify patient
        await notifyAppointmentBooked(
          patient_email, appointment_id, practitioner_name || '', department || '',
          appointment_date || '', appointment_time || ''
        );
        // Notify doctor
        if (practitioner_email) {
          await notifyDoctorNewAppointment(
            practitioner_email, appointment_id, body.patient_name || '', department || '',
            appointment_date || '', appointment_time || ''
          );
        }
        return NextResponse.json({ success: true });
      }

      case 'payment_confirmed': {
        const { patient_email, amount, appointment_id, transaction_id } = body;
        if (!patient_email || !appointment_id) {
          return NextResponse.json({ error: 'patient_email and appointment_id are required' }, { status: 400 });
        }
        await notifyPaymentConfirmed(patient_email, amount || 0, appointment_id, transaction_id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Notifications POST] Error:', error?.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to process notification action', detail: error.message },
      { status: 500 }
    );
  }
}
