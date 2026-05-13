'use client';

import { useState } from 'react';

interface PaymentSummaryProps {
  doctorName: string;
  department: string;
  date: string;
  time: string;
  appointmentType: string;
  consultationFee: number;
  onPay: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function PaymentSummary({
  doctorName,
  department,
  date,
  time,
  appointmentType,
  consultationFee,
  onPay,
  onBack,
  isLoading,
}: PaymentSummaryProps) {
  const totalAmount = consultationFee;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Review & Pay</h2>

      {/* Appointment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
          Appointment Summary
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Doctor:</span>
            <span className="ml-2 font-medium text-gray-900">{doctorName}</span>
          </div>
          <div>
            <span className="text-gray-500">Department:</span>
            <span className="ml-2 font-medium text-gray-900">{department}</span>
          </div>
          <div>
            <span className="text-gray-500">Date:</span>
            <span className="ml-2 font-medium text-gray-900">{date}</span>
          </div>
          <div>
            <span className="text-gray-500">Time:</span>
            <span className="ml-2 font-medium text-gray-900">{time}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Type:</span>
            <span className="ml-2 font-medium text-gray-900">{appointmentType}</span>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
          Fee Details
        </h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Consultation Fee</span>
          <span className="font-medium text-gray-900">Rs. {consultationFee.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg text-gray-900">Rs. {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-900">PayFast Secure Payment</p>
          <p className="text-xs text-gray-500">Credit/Debit Card, Mobile Wallet</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onPay}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </>
          ) : (
            `Pay Rs. ${totalAmount.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}
