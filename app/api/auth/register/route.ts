import { NextRequest, NextResponse } from 'next/server';
import { getFrappeServerClient } from '@/lib/frappe-client';
import { notifyPatientRegistration } from '@/lib/notifications';
import {
  assertUniqueEmailAndPhone,
  DuplicateIdentityError,
  normalizeEmail,
  normalizePhone,
} from '@/lib/registration-guards';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const first_name = String(body.first_name || '').trim();
    const last_name = String(body.last_name || '').trim();
    const email = normalizeEmail(String(body.email || ''));
    const mobile = normalizePhone(String(body.mobile || ''));
    const password = String(body.password || '');
    const sex = String(body.sex || 'Male').trim();
    const dob = String(body.dob || '').trim();
    const blood_group = String(body.blood_group || '').trim();

    if (!first_name || !last_name || !email || !mobile || !password || !dob) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const digits = mobile.replace(/\D/g, '');
    if (digits.length < 7) {
      return NextResponse.json(
        { error: 'Please enter a valid mobile number' },
        { status: 400 }
      );
    }

    const frappe = getFrappeServerClient();

    // Hard stop on duplicate email or phone before creating anything
    await assertUniqueEmailAndPhone(frappe, { email, mobile, checkUser: true });

    // 1. Create User
    try {
      await frappe.post('/resource/User', {
        email,
        first_name,
        last_name,
        send_welcome_email: 0,
        user_type: 'Website User',
        roles: [{ role: 'Patient' }],
        new_password: password,
        mobile_no: mobile,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.message || err?.response?.data?._error_message || '';
      if (status === 409 || status === 417 || /already exists|duplicate/i.test(String(detail))) {
        return NextResponse.json(
          {
            error: 'An account with this email already exists. Please log in instead.',
            field: 'email',
          },
          { status: 409 }
        );
      }
      console.error('[Register] User create failed:', err?.response?.data || err.message);
      return NextResponse.json(
        {
          error: 'User creation failed',
          detail: detail || err.message,
        },
        { status: status || 500 }
      );
    }

    // 2. Create Patient linked to the User (do not send password)
    try {
      await frappe.post('/resource/Patient', {
        first_name,
        last_name,
        patient_name: `${first_name} ${last_name}`,
        email,
        mobile,
        sex,
        dob,
        blood_group: blood_group || undefined,
        status: 'Active',
        user_id: email,
      });
    } catch (err: any) {
      const detail = err?.response?.data?.message || err?.response?.data?._error_message || err.message;
      console.error('[Register] Patient create failed:', err?.response?.data || err.message);
      return NextResponse.json(
        {
          error:
            'Account was created but patient registration failed. Please contact support or try logging in.',
          detail,
        },
        { status: 500 }
      );
    }

    // Fire-and-forget registration confirmation
    notifyPatientRegistration(email, `${first_name} ${last_name}`).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      email,
    });
  } catch (error: any) {
    if (error instanceof DuplicateIdentityError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 409 }
      );
    }

    console.error('[Register] Unexpected error:', error?.response?.data || error.message);
    return NextResponse.json(
      {
        error: 'Registration failed. Please try again.',
        detail: error?.message,
      },
      { status: 500 }
    );
  }
}
