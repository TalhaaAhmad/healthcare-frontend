import { NextRequest, NextResponse } from 'next/server';
import { getFrappeServerClient } from '@/lib/frappe-client';
import { getPendingPayment, removePendingPayment } from '@/lib/payment-store';

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID!;
const SECURED_KEY = process.env.PAYFAST_SECURED_KEY!;

function validateHash(
  basketId: string,
  receivedHash: string,
  errCode: string
): boolean {
  const validationString = `${basketId}|${SECURED_KEY}|${MERCHANT_ID}|${errCode}`;
  const calculatedHash = require('crypto')
    .createHash('sha256')
    .update(validationString)
    .digest('hex');
  return calculatedHash.toLowerCase() === receivedHash.toLowerCase();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const errCode = searchParams.get('err_code') || '';
  const errMsg = searchParams.get('err_msg') || '';
  const transactionId = searchParams.get('transaction_id') || '';
  const basketId = searchParams.get('basket_id') || '';
  const orderDate = searchParams.get('order_date') || '';
  const validationHash = searchParams.get('validation_hash') || '';

  // Get appointment data from server store
  const appointmentData = (await getPendingPayment(basketId)) || {};

  // Validate hash
  if (!validateHash(basketId, validationHash, errCode)) {
    console.error('[PayFast Success] Hash validation failed');
    return NextResponse.redirect(
      new URL(`/payment/failed?reason=Invalid+hash+validation`, request.url)
    );
  }

  // Check for success error code
  const isSuccess = errCode === '000' || errCode === '00';

  if (!isSuccess) {
    console.error('[PayFast Success] Payment failed:', errMsg);
    return NextResponse.redirect(
      new URL(
        `/payment/failed?reason=${encodeURIComponent(errMsg || 'Payment failed')}&code=${errCode}`,
        request.url
      )
    );
  }

  try {
    const frappe = getFrappeServerClient();
    let {
      patient,
      patient_name,
      practitioner,
      practitioner_name,
      department,
      appointment_date,
      appointment_time,
      appointment_type,
      notes,
      amount,
      relative,
      booked_by_name,
    } = appointmentData;

    // If booking for a relative, create the Patient record first
    if (relative && relative.first_name && relative.last_name) {
      try {
        const relativeRes = await frappe.post('/resource/Patient', {
          first_name: relative.first_name,
          last_name: relative.last_name,
          patient_name: `${relative.first_name} ${relative.last_name}`,
          sex: relative.sex,
          dob: relative.dob,
          blood_group: relative.blood_group || undefined,
          mobile: relative.mobile,
          status: 'Active',
          user_id: appointmentData.booked_by || '',
        });
        const createdPatient = relativeRes.data?.data;
        if (createdPatient?.name) {
          patient = createdPatient.name;
          patient_name = createdPatient.patient_name || `${relative.first_name} ${relative.last_name}`;
          console.log('[PayFast Success] Created relative patient:', patient);
        }
      } catch (relativeErr: any) {
        // If creation failed, try to find existing patient by name + mobile
        console.error('[PayFast Success] Relative patient creation failed, trying lookup:', relativeErr?.response?.data || relativeErr.message);
        try {
          const lookupRes = await frappe.get(
            `/resource/Patient?fields=["name","patient_name"]&filters=[["patient_name","=","${relative.first_name} ${relative.last_name}"],["mobile","=","${relative.mobile}"]]`
          );
          if (lookupRes.data?.data?.length > 0) {
            const existing = lookupRes.data.data[0];
            patient = existing.name;
            patient_name = existing.patient_name;
            console.log('[PayFast Success] Found existing relative patient:', patient);
          }
        } catch {
          console.error('[PayFast Success] Could not find existing relative patient either');
        }
      }
    }

    if (!patient || !practitioner) {
      return NextResponse.redirect(
        new URL(`/payment/failed?reason=Missing+appointment+data`, request.url)
      );
    }

    // Fetch first available Appointment Type if none provided
    let resolvedAppointmentType = appointment_type;
    if (!resolvedAppointmentType) {
      try {
        const apptTypeRes = await frappe.get('/resource/Appointment Type?fields=["name"]&limit_page_length=1');
        resolvedAppointmentType = apptTypeRes.data?.data?.[0]?.name || '';
      } catch {
        resolvedAppointmentType = '';
      }
    }

    // 1. Create Patient Appointment first
    const apptRes = await frappe.post('/resource/Patient Appointment', {
      patient,
      patient_name,
      practitioner,
      practitioner_name,
      department,
      appointment_date,
      appointment_time,
      appointment_type: resolvedAppointmentType,
      duration: 30,
      status: 'Scheduled',
      notes: notes || '',
      paid_amount: amount,
      mode_of_payment: 'PayFast',
    });

    const appointmentId = apptRes.data?.data?.name;

    if (!appointmentId) {
      throw new Error('Failed to create Patient Appointment');
    }

    // 2. Fetch practitioner's consultation item code
    let consultationItemCode = 'CN-1';
    try {
      const practitionerRes = await frappe.get(`/resource/Healthcare Practitioner/${practitioner}`);
      const practitionerData = practitionerRes.data?.data || {};
      consultationItemCode = practitionerData.op_consulting_charge_item || practitionerData.consultation_charge_item || 'CN-1';
      console.log('[PayFast Success] Using item code:', consultationItemCode);
    } catch (practitionerErr) {
      console.error('[PayFast Success] Could not fetch practitioner item code, using default:', practitionerErr);
    }

    // 3. Create Sales Invoice
    // Use appointment_date as the posting date to avoid timezone issues with server validation
    const invoiceDate = appointment_date || new Date().toISOString().split('T')[0];
    const invoiceRes = await frappe.post('/resource/Sales Invoice', {
      customer: patient_name || patient,
      patient: patient,
      posting_date: invoiceDate,
      due_date: invoiceDate,
      items: [
        {
          item_code: consultationItemCode,
          item_name: appointment_type || 'Consultation',
          description: `Consultation fee - ${practitioner_name || practitioner}`,
          qty: 1,
          rate: amount,
          amount: amount,
        },
      ],
      grand_total: amount,
      outstanding_amount: 0,
      status: 'Paid',
      appointment: appointmentId,
      remarks: `Payment via PayFast - TXN: ${transactionId}`,
    });

    const invoiceId = invoiceRes.data?.data?.name;

    // 2b. Submit the Sales Invoice
    if (invoiceId) {
      try {
        await frappe.put(`/resource/Sales Invoice/${invoiceId}`, {
          docstatus: 1,
        });
        console.log('[PayFast Success] Sales Invoice submitted:', invoiceId);
      } catch (submitErr: any) {
        console.error('[PayFast Success] Failed to submit Sales Invoice:', submitErr?.response?.data || submitErr.message);
        // Continue even if submission fails — invoice exists
      }
    }

    // 3. Create Payment Entry
    let paymentEntryId: string | undefined;
    if (invoiceId) {
      const paymentRes = await frappe.post('/resource/Payment Entry', {
        payment_type: 'Receive',
        party_type: 'Customer',
        party: patient_name || patient,
        posting_date: invoiceDate,
        paid_amount: amount,
        received_amount: amount,
        target_exchange_rate: 1,
        source_exchange_rate: 1,
        paid_to: 'Cash - AT',
        paid_to_account_currency: 'PKR',
        mode_of_payment: 'PayFast',
        references: [
          {
            reference_doctype: 'Sales Invoice',
            reference_name: invoiceId,
            allocated_amount: amount,
          },
        ],
      });
      paymentEntryId = paymentRes.data?.data?.name;

      // 3b. Submit the Payment Entry
      if (paymentEntryId) {
        try {
          await frappe.put(`/resource/Payment Entry/${paymentEntryId}`, {
            docstatus: 1,
          });
          console.log('[PayFast Success] Payment Entry submitted:', paymentEntryId);
        } catch (submitErr: any) {
          console.error('[PayFast Success] Failed to submit Payment Entry:', submitErr?.response?.data || submitErr.message);
        }
      }
    }

    // Clean up pending payment data
    await removePendingPayment(basketId);

    // Redirect to appointment detail page
    return NextResponse.redirect(
      new URL(`/patient/appointments/${appointmentId}?payment=success`, request.url)
    );
  } catch (error: any) {
    console.error('[PayFast Success] Error creating records:', error);
    return NextResponse.redirect(
      new URL(
        `/payment/failed?reason=${encodeURIComponent('Payment succeeded but failed to create appointment. Please contact support.')}`,
        request.url
      )
    );
  }
}
