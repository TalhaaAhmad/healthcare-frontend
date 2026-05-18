import { NextRequest, NextResponse } from 'next/server';
import { storePendingPayment } from '@/lib/payment-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { basket_id, appointment_data } = body;

    if (!basket_id || !appointment_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await storePendingPayment(basket_id, appointment_data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Store Appointment] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
