'use client';

import { useUserAppointments } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function TransactionHistory() {
  const { user } = useAuth();

  const { data: apptData, isLoading } = useUserAppointments(user?.email || '');
  const appointments = apptData?.data || [];

  // Treat all appointments as transactions (they all require payment)
  const transactions = appointments.map((appt: any) => ({
    id: appt.name,
    date: appt.appointment_date,
    doctor: appt.practitioner_name,
    department: appt.department,
    type: appt.appointment_type,
    amount: appt.paid_amount || 0,
    status: appt.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
          Transaction History
        </h1>
      </div>

      <div className="bg-white border border-gray-100">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-[#333333]" style={{ fontFamily: "var(--font-eb-garamond), 'EB Garamond', Georgia, serif" }}>
            All Transactions
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <LoadingSpinner className="py-8" />
          ) : transactions.length === 0 ? (
            <p className="px-4 sm:px-6 py-8 text-center text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
              No transactions found
            </p>
          ) : (
            transactions.map((tx: any) => (
              <Link
                key={tx.id}
                href={`/patient/appointments/${tx.id}`}
                className="block px-4 sm:px-6 py-4 hover:bg-[#F4F7FA] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div>
                    <p className="font-medium text-sm sm:text-base text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                      {tx.doctor}
                    </p>
                    <p className="text-xs sm:text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                      {tx.department} | {tx.type}
                    </p>
                    {tx.patient_name && tx.patient_name !== user?.full_name && (
                      <p className="text-xs text-[#E500BB] font-medium mt-0.5" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>for {tx.patient_name}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm font-medium text-[#333333]" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                        {tx.date}
                      </p>
                      <p className="text-xs sm:text-sm text-[#001E42] font-semibold" style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}>
                        Rs. {tx.amount.toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`px-2 sm:px-3 py-1 text-xs font-semibold ${
                        tx.status === 'Scheduled'
                          ? 'bg-[#F2F8F5] text-[#001E42]'
                          : tx.status === 'Closed'
                          ? 'bg-[#F2F8F5] text-[#001E42]'
                          : tx.status === 'Cancelled'
                          ? 'bg-[#FCE7EC] text-[#E500BB]'
                          : 'bg-[#F4F7FA] text-[#6C7087]'
                      }`}
                      style={{ fontFamily: "var(--font-open-sans), 'Open Sans', Arial, sans-serif" }}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
