import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFrappeServerClient } from '@/lib/frappe-client';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' })
  : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { invoice_id, patient_id } = paymentIntent.metadata;

    // Create Payment Entry in Frappe
    await getFrappeServerClient().post('/resource/Payment Entry', {
      payment_type: 'Receive',
      party_type: 'Customer',
      party: patient_id,
      posting_date: new Date().toISOString().split('T')[0],
      paid_amount: paymentIntent.amount / 100,
      received_amount: paymentIntent.amount / 100,
      mode_of_payment: 'Stripe',
      references: [{
        reference_doctype: 'Sales Invoice',
        reference_name: invoice_id,
        allocated_amount: paymentIntent.amount / 100
      }]
    });

    // Update invoice status
    await getFrappeServerClient().put(`/resource/Sales Invoice/${invoice_id}`, {
      status: 'Paid'
    });
  }

  return NextResponse.json({ received: true });
}
