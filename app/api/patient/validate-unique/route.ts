import { NextRequest, NextResponse } from 'next/server';
import { getFrappeServerClient } from '@/lib/frappe-client';
import {
  assertUniqueEmailAndPhone,
  DuplicateIdentityError,
  normalizeEmail,
  normalizePhone,
} from '@/lib/registration-guards';

/**
 * Validate that email and mobile are not already used by another patient.
 * Used by profile updates so contact details stay unique.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ''));
    const mobile = normalizePhone(String(body.mobile || ''));
    const excludePatientId = body.excludePatientId
      ? String(body.excludePatientId)
      : undefined;

    if (!email || !mobile) {
      return NextResponse.json(
        { error: 'Email and mobile are required' },
        { status: 400 }
      );
    }

    const frappe = getFrappeServerClient();

    // Profile updates Patient only — skip User check so the patient's own
    // linked User email does not falsely conflict.
    await assertUniqueEmailAndPhone(frappe, {
      email,
      mobile,
      excludePatientId,
      checkUser: false,
    });

    return NextResponse.json({ unique: true });
  } catch (error: any) {
    if (error instanceof DuplicateIdentityError) {
      return NextResponse.json(
        { error: error.message, field: error.field, unique: false },
        { status: 409 }
      );
    }

    console.error('[Validate Unique] Error:', error?.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to validate uniqueness', detail: error.message },
      { status: 500 }
    );
  }
}
