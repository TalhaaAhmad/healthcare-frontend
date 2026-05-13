import { NextRequest, NextResponse } from 'next/server';
import { storePendingPayment } from '@/lib/payment-store';

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID!;
const SECURED_KEY = process.env.PAYFAST_SECURED_KEY!;
const TOKEN_URL = process.env.PAYFAST_TOKEN_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { basket_id, amount, currency_code = 'PKR', appointment_data } = body;

    if (!basket_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: basket_id, amount' },
        { status: 400 }
      );
    }

    // Store appointment data if provided
    if (appointment_data) {
      storePendingPayment(basket_id, appointment_data);
    }

    // ✅ Use URLSearchParams — PayFast expects form-urlencoded, not JSON
    const params = new URLSearchParams({
      MERCHANT_ID: MERCHANT_ID,
      SECURED_KEY: SECURED_KEY,
      BASKET_ID: basket_id,
      TXNAMT: amount.toString(),
      CURRENCY_CODE: currency_code,
    });

    console.log('[PayFast Token] Request URL:', TOKEN_URL);
    console.log('[PayFast Token] Params:', params.toString());

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        // ✅ This is what PayFast actually accepts
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log('[PayFast Token] Raw response:', responseText);

    let responsePayload: any;
    try {
      responsePayload = JSON.parse(responseText);
    } catch {
      // If response isn't JSON, surface the raw text for debugging
      return NextResponse.json(
        { error: 'PayFast returned non-JSON response', raw: responseText },
        { status: 502 }
      );
    }

    const token = responsePayload?.ACCESS_TOKEN || '';

    if (!token) {
      console.error('[PayFast Token] No token received:', responsePayload);
      return NextResponse.json(
        { error: 'Failed to get access token from PayFast', detail: responsePayload },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token,
      basket_id,
      amount,
      currency_code,
      merchant_id: MERCHANT_ID,
    });

  } catch (error: any) {
    console.error('[PayFast Token] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    );
  }
}