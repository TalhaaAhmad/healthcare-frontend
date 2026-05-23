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
    <div className="bg-white p-4 sm:p-6 border border-gray-100 space-y-4 sm:space-y-6">
      <h2 className="text-base sm:text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Review & Pay</h2>

      {/* Appointment Summary */}
      <div className="bg-[#F4F7FA] p-3 sm:p-4 space-y-2">
        <h3 className="text-xs sm:text-sm font-medium text-[#6C7087] uppercase tracking-wide" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          Appointment Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Doctor:</span>
            <span className="ml-2 font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{doctorName}</span>
          </div>
          <div>
            <span className="text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Department:</span>
            <span className="ml-2 font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{department}</span>
          </div>
          <div>
            <span className="text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Date:</span>
            <span className="ml-2 font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{date}</span>
          </div>
          <div>
            <span className="text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Time:</span>
            <span className="ml-2 font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{time}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Type:</span>
            <span className="ml-2 font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>{appointmentType}</span>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[#6C7087] uppercase tracking-wide" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          Fee Details
        </h3>
        <div className="flex justify-between text-sm">
          <span className="text-[#666666]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Consultation Fee</span>
          <span className="font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Rs. {consultationFee.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Total</span>
          <span className="font-bold text-lg text-[#001E42]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Rs. {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="flex items-center gap-3 p-3 bg-[#F2F8F5]">
        <svg className="h-6 w-6 text-[#001E42]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>PayFast Secure Payment</p>
          <p className="text-xs text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Credit/Debit Card, Mobile Wallet</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-4 py-3 bg-white text-[#333333] text-xs font-bold uppercase tracking-[2px] border border-[#333333] hover:bg-[#333333] hover:text-white transition-colors"
          style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onPay}
          disabled={isLoading}
          className="flex-1 px-4 py-3 bg-[#E500BB] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#c400a0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
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
