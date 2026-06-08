import { getFrappeServerClient } from './frappe-client';

// ─── Notification Types ────────────────────────────────────────────────────────

export type NotificationType = 'Alert' | 'Mention' | '';

export interface NotificationLog {
  name: string;
  subject: string;
  email_content: string;
  document_type?: string;
  document_name?: string;
  for_user: string;
  type: NotificationType;
  read: number;
  creation: string;
  from_user?: string;
}

export interface NotificationPayload {
  subject: string;
  body: string;
  for_user: string;
  type?: NotificationType;
  document_type?: string;
  document_name?: string;
  from_user?: string;
}

// ─── Core: Create Notification in Frappe ───────────────────────────────────────

/**
 * Create a Notification Log entry in Frappe for a given user.
 * Uses the built-in Frappe "Notification Log" doctype.
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    const frappe = getFrappeServerClient();
    await frappe.post('/resource/Notification Log', {
      subject: payload.subject,
      email_content: payload.body,
      for_user: payload.for_user,
      type: payload.type || 'Alert',
      document_type: payload.document_type || '',
      document_name: payload.document_name || '',
      from_user: payload.from_user || 'Administrator',
    });
    console.log(`[Notification] Created: "${payload.subject}" for ${payload.for_user}`);
  } catch (error: any) {
    // Log but don't throw — notifications should not break main flows
    console.error(
      `[Notification] Failed to create "${payload.subject}" for ${payload.for_user}:`,
      error?.response?.data || error.message
    );
  }
}

// ─── Fetch Notifications for a User ────────────────────────────────────────────

/**
 * Fetch notification logs for a specific user from Frappe.
 */
export async function getUserNotifications(
  userEmail: string,
  limit = 30,
  unreadOnly = false
): Promise<NotificationLog[]> {
  try {
    const frappe = getFrappeServerClient();
    const filters: any[] = [['for_user', '=', userEmail]];
    if (unreadOnly) {
      filters.push(['read', '=', 0]);
    }

    const res = await frappe.get('/resource/Notification Log', {
      params: {
        fields: JSON.stringify([
          'name', 'subject', 'email_content', 'document_type',
          'document_name', 'for_user', 'type', 'read', 'creation', 'from_user',
        ]),
        filters: JSON.stringify(filters),
        order_by: 'creation desc',
        limit_page_length: limit,
      },
    });

    return res.data?.data || [];
  } catch (error: any) {
    console.error('[Notification] Failed to fetch:', error?.response?.data || error.message);
    return [];
  }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    const frappe = getFrappeServerClient();
    await frappe.put(`/resource/Notification Log/${notificationId}`, { read: 1 });
  } catch (error: any) {
    console.error('[Notification] Failed to mark read:', error?.response?.data || error.message);
  }
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllNotificationsRead(userEmail: string): Promise<void> {
  try {
    const frappe = getFrappeServerClient();
    const unread = await getUserNotifications(userEmail, 100, true);
    await Promise.all(unread.map((n) => markNotificationRead(n.name)));
  } catch (error: any) {
    console.error('[Notification] Failed to mark all read:', error?.response?.data || error.message);
  }
}

// ─── Notification Creators ─────────────────────────────────────────────────────

/**
 * Patient: Registration confirmation notification.
 */
export async function notifyPatientRegistration(
  patientEmail: string,
  patientName: string
): Promise<void> {
  await createNotification({
    subject: 'Welcome to Zan Center for Women!',
    body: `
      <p>Dear <strong>${patientName}</strong>,</p>
      <p>Your patient account has been successfully created.</p>
      <p>You can now:</p>
      <ul>
        <li>Book appointments with our specialists</li>
        <li>View your medical records</li>
        <li>Track your appointments and payments</li>
      </ul>
      <p>Welcome aboard!</p>
    `,
    for_user: patientEmail,
    type: 'Mention',
  });
}

/**
 * Patient: Appointment booking confirmation.
 */
export async function notifyAppointmentBooked(
  patientEmail: string,
  appointmentId: string,
  practitionerName: string,
  department: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> {
  await createNotification({
    subject: `Appointment Confirmed – ${appointmentId}`,
    body: `
      <p>Your appointment has been successfully booked.</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:4px 8px;font-weight:bold;">Doctor</td><td style="padding:4px 8px;">${practitionerName}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Department</td><td style="padding:4px 8px;">${department}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Date</td><td style="padding:4px 8px;">${appointmentDate}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Time</td><td style="padding:4px 8px;">${appointmentTime}</td></tr>
      </table>
      <p style="margin-top:12px;">We look forward to seeing you!</p>
    `,
    for_user: patientEmail,
    type: 'Alert',
    document_type: 'Patient Appointment',
    document_name: appointmentId,
  });
}

/**
 * Patient: Payment confirmation notification.
 */
export async function notifyPaymentConfirmed(
  patientEmail: string,
  amount: number,
  appointmentId: string,
  transactionId?: string
): Promise<void> {
  await createNotification({
    subject: `Payment Received – Rs. ${amount.toLocaleString()}`,
    body: `
      <p>Your payment of <strong>Rs. ${amount.toLocaleString()}</strong> has been successfully processed.</p>
      ${transactionId ? `<p>Transaction ID: <strong>${transactionId}</strong></p>` : ''}
      <p>Appointment: <strong>${appointmentId}</strong></p>
      <p>Thank you for your payment!</p>
    `,
    for_user: patientEmail,
    type: 'Alert',
    document_type: 'Patient Appointment',
    document_name: appointmentId,
  });
}

/**
 * Patient: Appointment reminder (1 day before).
 */
export async function notifyAppointmentReminder1Day(
  patientEmail: string,
  appointmentId: string,
  practitionerName: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> {
  await createNotification({
    subject: `Reminder: Appointment Tomorrow – ${appointmentId}`,
    body: `
      <p>This is a reminder that you have an appointment <strong>tomorrow</strong>.</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:4px 8px;font-weight:bold;">Doctor</td><td style="padding:4px 8px;">${practitionerName}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Date</td><td style="padding:4px 8px;">${appointmentDate}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Time</td><td style="padding:4px 8px;">${appointmentTime}</td></tr>
      </table>
      <p style="margin-top:12px;">Please arrive 10 minutes before your scheduled time.</p>
    `,
    for_user: patientEmail,
    type: 'Alert',
    document_type: 'Patient Appointment',
    document_name: appointmentId,
  });
}

/**
 * Patient: Appointment reminder (30 minutes before).
 */
export async function notifyAppointmentReminder30Min(
  patientEmail: string,
  appointmentId: string,
  practitionerName: string,
  appointmentTime: string
): Promise<void> {
  await createNotification({
    subject: `Reminder: Appointment in 30 Minutes – ${appointmentId}`,
    body: `
      <p>Your appointment with <strong>${practitionerName}</strong> is in <strong>30 minutes</strong> (${appointmentTime}).</p>
      <p>Please make sure you are ready and available.</p>
    `,
    for_user: patientEmail,
    type: 'Alert',
    document_type: 'Patient Appointment',
    document_name: appointmentId,
  });
}

/**
 * Doctor: New appointment booking notification.
 */
export async function notifyDoctorNewAppointment(
  doctorEmail: string,
  appointmentId: string,
  patientName: string,
  department: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> {
  await createNotification({
    subject: `New Appointment Booked – ${appointmentId}`,
    body: `
      <p>A new appointment has been booked.</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:4px 8px;font-weight:bold;">Patient</td><td style="padding:4px 8px;">${patientName}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Department</td><td style="padding:4px 8px;">${department}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Date</td><td style="padding:4px 8px;">${appointmentDate}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:bold;">Time</td><td style="padding:4px 8px;">${appointmentTime}</td></tr>
      </table>
    `,
    for_user: doctorEmail,
    type: 'Mention',
    document_type: 'Patient Appointment',
    document_name: appointmentId,
  });
}

/**
 * Doctor: 30-minute appointment reminder.
 */
export async function notifyDoctorAppointmentReminder30Min(
  doctorEmail: string,
  appointmentId: string,
  patientName: string,
  appointmentTime: string
): Promise<void> {
  await createNotification({
    subject: `Upcoming: Appointment in 30 Minutes – ${appointmentId}`,
    body: `
      <p>You have an appointment with <strong>${patientName}</strong> in <strong>30 minutes</strong> (${appointmentTime}).</p>
    `,
    for_user: doctorEmail,
    type: 'Alert',
    document_type: 'Patient Appointment',
    document_name: appointmentId,
  });
}

// ─── Scheduled Reminder Check ──────────────────────────────────────────────────

/**
 * Check all upcoming scheduled appointments and create reminder notifications.
 * Call this periodically (e.g. via API route triggered by a cron job or polling).
 *
 * - 1 day before: creates reminder if appointment is tomorrow and not yet reminded
 * - 30 min before: creates reminder if appointment is within 30 min window
 */
export async function processAppointmentReminders(): Promise<{
  processed: number;
  reminders_sent: number;
}> {
  const frappe = getFrappeServerClient();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  let processed = 0;
  let remindersSent = 0;

  try {
    // ── 1-day reminders (appointments scheduled for tomorrow) ──────────────
    const tomorrowAppts = await frappe.get('/resource/Patient Appointment', {
      params: {
        fields: JSON.stringify([
          'name', 'patient', 'patient_name', 'practitioner', 'practitioner_name',
          'appointment_date', 'appointment_time', 'status', 'reminded',
        ]),
        filters: JSON.stringify([
          ['appointment_date', '=', tomorrowStr],
          ['status', '=', 'Scheduled'],
        ]),
        limit_page_length: 200,
      },
    });

    const tomorrowList = tomorrowAppts.data?.data || [];

    for (const appt of tomorrowList) {
      processed++;

      // Check if 1-day reminder already sent (using custom field or skip logic)
      // We check if a notification already exists for this appointment + "Tomorrow" subject
      const existingCheck = await frappe.get('/resource/Notification Log', {
        params: {
          fields: JSON.stringify(['name']),
          filters: JSON.stringify([
            ['document_type', '=', 'Patient Appointment'],
            ['document_name', '=', appt.name],
            ['subject', 'like', '%Tomorrow%'],
          ]),
          limit_page_length: 1,
        },
      });

      if ((existingCheck.data?.data || []).length > 0) continue;

      // Look up patient email
      const patientEmail = await getPatientEmail(frappe, appt.patient);
      if (!patientEmail) continue;

      await notifyAppointmentReminder1Day(
        patientEmail,
        appt.name,
        appt.practitioner_name,
        appt.appointment_date,
        appt.appointment_time
      );

      // Also notify doctor
      const doctorEmail = await getPractitionerEmail(frappe, appt.practitioner);
      // No 1-day reminder for doctors per requirements, only 30-min

      remindersSent++;
    }

    // ── 30-minute reminders (appointments today, within the next 30 min window) ──
    const todayAppts = await frappe.get('/resource/Patient Appointment', {
      params: {
        fields: JSON.stringify([
          'name', 'patient', 'patient_name', 'practitioner', 'practitioner_name',
          'appointment_date', 'appointment_time', 'status',
        ]),
        filters: JSON.stringify([
          ['appointment_date', '=', todayStr],
          ['status', '=', 'Scheduled'],
        ]),
        limit_page_length: 200,
      },
    });

    const todayList = todayAppts.data?.data || [];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const appt of todayList) {
      processed++;

      const apptMinutes = parseTimeToMinutes(appt.appointment_time);
      if (apptMinutes === null) continue;

      const diffMinutes = apptMinutes - currentMinutes;

      // Only trigger if appointment is 0–30 minutes from now
      if (diffMinutes < 0 || diffMinutes > 30) continue;

      // Check if 30-min reminder already sent
      const existingCheck = await frappe.get('/resource/Notification Log', {
        params: {
          fields: JSON.stringify(['name']),
          filters: JSON.stringify([
            ['document_type', '=', 'Patient Appointment'],
            ['document_name', '=', appt.name],
            ['subject', 'like', '%30 Minutes%'],
          ]),
          limit_page_length: 1,
        },
      });

      if ((existingCheck.data?.data || []).length > 0) continue;

      // Patient reminder
      const patientEmail = await getPatientEmail(frappe, appt.patient);
      if (patientEmail) {
        await notifyAppointmentReminder30Min(
          patientEmail,
          appt.name,
          appt.practitioner_name,
          appt.appointment_time
        );
        remindersSent++;
      }

      // Doctor reminder
      const doctorEmail = await getPractitionerEmail(frappe, appt.practitioner);
      if (doctorEmail) {
        await notifyDoctorAppointmentReminder30Min(
          doctorEmail,
          appt.name,
          appt.patient_name,
          appt.appointment_time
        );
        remindersSent++;
      }
    }
  } catch (error: any) {
    console.error('[Reminder] Error processing reminders:', error?.response?.data || error.message);
  }

  return { processed, reminders_sent: remindersSent };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function getPatientEmail(frappe: any, patientId: string): Promise<string | null> {
  try {
    const res = await frappe.get(`/resource/Patient/${patientId}`);
    return res.data?.data?.email || res.data?.data?.user_id || null;
  } catch {
    return null;
  }
}

async function getPractitionerEmail(frappe: any, practitionerId: string): Promise<string | null> {
  try {
    const res = await frappe.get(`/resource/Healthcare Practitioner/${practitionerId}`);
    return res.data?.data?.user_id || res.data?.data?.email || null;
  } catch {
    return null;
  }
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  // Handle "HH:MM:SS" or "HH:MM" format
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}
