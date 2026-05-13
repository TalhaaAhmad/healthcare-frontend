import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Verify webhook signature (if configured)
    // const signature = request.headers.get('x-frappe-webhook-signature');

    // Invalidate caches
    revalidateTag('appointments', 'default');

    // Send push notification (Firebase)
    if (payload.data?.practitioner) {
      // Notify doctor's device
      // TODO: Implement Firebase push notification
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
