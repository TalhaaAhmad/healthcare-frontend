'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDoctorList, usePractitionerSchedule, usePractitionerAppointments, useFrappeGetOne, useAppointmentTypes } from '@/hooks/use-frappe';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import PaymentSummary from '@/components/payment/PaymentSummary';

function getDayName(dateStr: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Parse YYYY-MM-DD as local date to avoid UTC timezone shifts
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  return days[date.getDay()];
}

function formatTime(timeStr: string) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDay.getDay();
  return { daysInMonth, startDayOfWeek };
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDoctorId = searchParams.get('doctor');

  const { patientId, user } = useAuth();
  const patientName = user?.full_name || '';
  const userEmail = user?.email || '';

  const { data: doctorData, isLoading: doctorLoading } = useDoctorList();
  const doctors = doctorData?.data || [];

  const { data: apptTypeData } = useAppointmentTypes();
  const appointmentTypes = apptTypeData?.data || [];
  const defaultAppointmentType = appointmentTypes.length > 0 ? appointmentTypes[0].name : '';

  const [showPayment, setShowPayment] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [form, setForm] = useState({
    practitioner: '',
    practitioner_name: '',
    department: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: '',
    notes: '',
    patient_type: 'self' as 'self' | 'relative',
  });

  // Set default appointment type once types are loaded
  useEffect(() => {
    if (defaultAppointmentType && !form.appointment_type) {
      setForm((prev) => ({ ...prev, appointment_type: defaultAppointmentType }));
    }
  }, [defaultAppointmentType]);

  const [relative, setRelative] = useState({
    first_name: '',
    last_name: '',
    sex: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    blood_group: '',
    mobile: '',
    relationship: 'Son' as 'Son' | 'Daughter' | 'Wife' | 'Husband' | 'Brother' | 'Sister' | 'Mother' | 'Father',
  });

  // Calendar state — must be before any conditional returns
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  // Pre-select doctor from URL query param
  useEffect(() => {
    if (selectedDoctorId && doctors.length > 0) {
      const doctor = doctors.find((d: any) => d.name === selectedDoctorId);
      if (doctor) {
        setForm((prev) => ({
          ...prev,
          practitioner: doctor.name,
          practitioner_name: doctor.practitioner_name,
          department: doctor.department,
          appointment_date: '',
          appointment_time: '',
        }));
      }
    }
  }, [selectedDoctorId, doctors]);

  // Fetch practitioner details to get their consultation fee
  const { data: practitionerDetail } = useFrappeGetOne('Healthcare Practitioner', form.practitioner);
  const practitionerData = practitionerDetail?.data || {};

  // Get consultation fee from practitioner (fallback to 500 if not set)
  const CONSULTATION_FEE = practitionerData.op_consulting_charge || practitionerData.consultation_charge || 500;

  const { data: scheduleData } = usePractitionerSchedule(form.practitioner);
  const { data: existingApptsData } = usePractitionerAppointments(form.practitioner, form.appointment_date);

  // Compute available slots
  const schedule = scheduleData?.data;
  const existingAppts = existingApptsData?.data || [];
  const bookedTimes = new Set(existingAppts.map((a: any) => a.appointment_time));

  const availableSlots: { from_time: string; to_time: string; day: string }[] = [];
  if (schedule && form.appointment_date) {
    const dayName = getDayName(form.appointment_date);
    const slots = schedule.time_slots || [];
    slots.forEach((slot: any) => {
      if (slot.day === dayName && !bookedTimes.has(slot.from_time)) {
        availableSlots.push(slot);
      }
    });
  }

  function handleSelectDoctor(doctorId: string) {
    router.push(`/patient/appointments/book?doctor=${encodeURIComponent(doctorId)}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowPayment(true);
  }

  async function handlePay() {
    setIsPaying(true);
    try {
      const isRelative = form.patient_type === 'relative';
      const appointmentData: any = {
        patient: patientId,
        patient_name: patientName,
        practitioner: form.practitioner,
        practitioner_name: form.practitioner_name,
        department: form.department,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        appointment_type: form.appointment_type,
        notes: form.notes,
        amount: CONSULTATION_FEE,
        booked_by: userEmail,
        booked_by_name: patientName,
      };

      if (isRelative) {
        appointmentData.relative = { ...relative };
      }

      const paymentAmount = CONSULTATION_FEE.toFixed(2);

      const basketId = `A${Date.now().toString(36).toUpperCase().slice(-8)}`;

      await fetch('/api/payment/store-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          appointment_data: appointmentData,
        }),
      });

      const tokenRes = await fetch('/api/payment/payfast-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          amount: paymentAmount,
          currency_code: 'PKR',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.token) {
        throw new Error(tokenData.error || 'Failed to get payment token');
      }

      const formEl = document.createElement('form');
      formEl.method = 'POST';
      formEl.action = process.env.PAYFAST_POST_URL || 'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction';

      const fields: Record<string, string> = {
        MERCHANT_ID: tokenData.merchant_id.toString(),
        TOKEN: tokenData.token,
        BASKET_ID: basketId,
        TXNAMT: paymentAmount,
        CURRENCY_CODE: 'PKR',
        ORDER_DATE: new Date().toISOString().replace('T', ' ').slice(0, 19),
        TRAN_TYPE: 'ECOMM_PURCHASE',
        SUCCESS_URL: `${window.location.origin}/api/payment/payfast-success`,
        FAILURE_URL: `${window.location.origin}/payment/failed`,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        formEl.appendChild(input);
      });

      document.body.appendChild(formEl);
      formEl.submit();
      document.body.removeChild(formEl);
    } catch (err: any) {
      console.error('[PayFast] Payment error:', err);
      alert('Payment initiation failed: ' + err.message);
      setIsPaying(false);
    }
  }

  function handleBackToForm() {
    setShowPayment(false);
  }

  // Step 1: Doctor Selection
  if (!selectedDoctorId) {
    return (
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FCE7EC] text-[#E500BB] text-[11px] font-bold uppercase tracking-[2px] rounded-full" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E500BB]"></span>
            Premium Healthcare
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            Find Your Best <span className="text-[#E500BB]">Specialist</span>
          </h1>
          <p className="text-sm text-[#6C7087] max-w-md mx-auto" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            Book appointments with world-class practitioners and manage your healthcare journey in one place.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C7087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by doctor name or expertise..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-white text-sm text-[#333333] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E500BB] transition-colors"
              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
            />
          </div>
          <button
            className="px-6 py-3 bg-[#1F2937] text-white text-xs font-bold uppercase tracking-[2px] hover:bg-[#111827] transition-colors flex items-center gap-2"
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>

        {/* Section Title */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            Top Rated Specialists
          </h2>
          <p className="text-sm text-[#6C7087] mt-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
            <span className="w-1.5 h-1.5 inline-block rounded-full bg-[#10B981] mr-1.5"></span>
            {doctors.length} active practitioner{doctors.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {doctorLoading ? (
          <LoadingSpinner className="py-12" />
        ) : doctors.length === 0 ? (
          <p className="text-center text-[#6C7087] py-12" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>No doctors found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor: any) => (
                <button
                  key={doctor.name}
                  onClick={() => handleSelectDoctor(doctor.name)}
                  className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow text-left"
                >
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#F4F7FA] flex items-center justify-center overflow-hidden">
                      {doctor.image ? (
                        <img
                          src={doctor.image.startsWith('http') ? doctor.image : `${process.env.NEXT_PUBLIC_FRAPPE_URL}${doctor.image}`}
                          alt={doctor.practitioner_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg sm:text-xl font-semibold text-[#9CA3AF]">
                          {doctor.practitioner_name ? doctor.practitioner_name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'D'}
                        </span>
                      )}
                    </div>
                    {doctor.status === 'Active' && (
                      <span className="absolute bottom-0 left-12 sm:left-16 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white"></span>
                    )}
                  </div>

                  {/* Specialty */}
                  <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#E500BB] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                    {doctor.department || 'Family Medicine'}
                  </p>

                  {/* Name */}
                  <h3 className="text-base sm:text-lg font-semibold text-[#1F2937] mb-3" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                    {doctor.practitioner_name}
                  </h3>

                  {/* Fee & Rating */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#9CA3AF]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Fee Starting</p>
                      <p className="text-sm font-semibold text-[#1F2937]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        Premium
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#9CA3AF]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Rating</p>
                      <p className="text-sm font-semibold text-[#1F2937] flex items-center gap-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        <svg className="w-3.5 h-3.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        4.9
                      </p>
                    </div>
                  </div>
                </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const selectedDateObj = form.appointment_date ? new Date(form.appointment_date + 'T00:00:00') : null;
  const { daysInMonth, startDayOfWeek } = getMonthData(calendarYear, calendarMonth);

  function handlePrevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  }

  function handleNextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  }

  function handleSelectDate(day: number) {
    const yyyy = calendarYear;
    const mm = String(calendarMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setForm({ ...form, appointment_date: `${yyyy}-${mm}-${dd}`, appointment_time: '' });
  }

  // Group slots by period
  const afternoonSlots = availableSlots.filter((s: any) => {
    const h = parseInt(s.from_time.split(':')[0], 10);
    return h >= 12 && h < 17;
  });
  const eveningSlots = availableSlots.filter((s: any) => {
    const h = parseInt(s.from_time.split(':')[0], 10);
    return h >= 17;
  });

  // Step 2: Booking Form
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => router.push('/patient/appointments/book')}
          className="text-[#333333] hover:text-[#001E42] transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[2px] text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          Appointment Booking
        </span>
        <span className="text-xs font-semibold uppercase tracking-[2px] text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
          Step 2/3
        </span>
      </div>

      {!showPayment && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Doctor & Patient Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* Doctor Info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-[#E500BB] rounded-lg flex items-center justify-center text-white text-lg font-semibold shrink-0">
                {form.practitioner_name ? form.practitioner_name.charAt(0).toUpperCase() : 'D'}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                  {form.practitioner_name || 'Loading...'}
                </p>
                <p className="text-xs text-[#6C7087] uppercase font-medium" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                  {form.department || 'Family Medicine'}
                </p>
              </div>
            </div>

            {/* Appointment Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1px] text-[#6C7087] mb-2" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                Appointment Type
              </label>
              <select
                value={form.appointment_type}
                onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 bg-white text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
              >
                {appointmentTypes.length === 0 && <option value="">Loading...</option>}
                {appointmentTypes.map((type: any) => (
                  <option key={type.name} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Patient Profile */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[1px] text-[#6C7087] mb-2" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                Patient Profile
              </label>
              <select
                value={form.patient_type}
                onChange={(e) => setForm({ ...form, patient_type: e.target.value as 'self' | 'relative' })}
                className="w-full px-4 py-3 border border-gray-200 bg-white text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
              >
                <option value="self">Myself — {patientName || 'Loading...'}</option>
                <option value="relative">Someone Else (Relative)</option>
              </select>
            </div>

            {/* Relative Details Form */}
            {form.patient_type === 'relative' && (
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[1px] text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                  Relative Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#6C7087] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>First Name</label>
                    <input
                      type="text"
                      required
                      value={relative.first_name}
                      onChange={(e) => setRelative({ ...relative, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                      style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6C7087] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Last Name</label>
                    <input
                      type="text"
                      required
                      value={relative.last_name}
                      onChange={(e) => setRelative({ ...relative, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                      style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#6C7087] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Sex</label>
                    <select
                      value={relative.sex}
                      onChange={(e) => setRelative({ ...relative, sex: e.target.value as 'Male' | 'Female' | 'Other' })}
                      className="w-full px-3 py-2 border border-gray-200 text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                      style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6C7087] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Relationship</label>
                    <select
                      value={relative.relationship}
                      onChange={(e) => setRelative({ ...relative, relationship: e.target.value as typeof relative.relationship })}
                      className="w-full px-3 py-2 border border-gray-200 text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                      style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
                    >
                      <option>Son</option>
                      <option>Daughter</option>
                      <option>Wife</option>
                      <option>Husband</option>
                      <option>Brother</option>
                      <option>Sister</option>
                      <option>Mother</option>
                      <option>Father</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#6C7087] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={relative.dob}
                    onChange={(e) => setRelative({ ...relative, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                    style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6C7087] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Mobile</label>
                  <input
                    type="tel"
                    required
                    value={relative.mobile}
                    onChange={(e) => setRelative({ ...relative, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                    style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6C7087] mb-1" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>Blood Group</label>
                  <select
                    value={relative.blood_group}
                    onChange={(e) => setRelative({ ...relative, blood_group: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 text-sm text-[#333333] focus:outline-none focus:border-[#001E42]"
                    style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif", borderRadius: 0 }}
                  >
                    <option value="">Select</option>
                    <option value="A Positive">A+</option>
                    <option value="A Negative">A-</option>
                    <option value="B Positive">B+</option>
                    <option value="B Negative">B-</option>
                    <option value="AB Positive">AB+</option>
                    <option value="AB Negative">AB-</option>
                    <option value="O Positive">O+</option>
                    <option value="O Negative">O-</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Center - Calendar */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-100 p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[2px] text-[#6C7087] text-center mb-4" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                Select Date
              </p>

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xl font-semibold text-[#333333]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long' })}
                  </p>
                  <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                    {calendarYear}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="h-8 w-8 flex items-center justify-center border border-gray-200 text-[#6C7087] hover:text-[#333333] hover:border-[#333333] transition-colors"
                    aria-label="Previous month"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="h-8 w-8 flex items-center justify-center border border-gray-200 text-[#6C7087] hover:text-[#333333] hover:border-[#333333] transition-colors"
                    aria-label="Next month"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-[#6C7087] py-2" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for start offset */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const currentDate = new Date(calendarYear, calendarMonth, day);
                  const isToday = isSameDay(currentDate, today);
                  const isSelected = selectedDateObj ? isSameDay(currentDate, selectedDateObj) : false;
                  const isPast = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => !isPast && handleSelectDate(day)}
                      disabled={isPast}
                      className={`h-10 w-10 mx-auto flex items-center justify-center text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#E500BB] text-white rounded-full'
                          : isToday
                          ? 'text-[#E500BB]'
                          : isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-[#333333] hover:bg-gray-100'
                      }`}
                      style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Time Slots */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-100 p-4 sm:p-6 h-full">
              <p className="text-xs font-semibold uppercase tracking-[2px] text-[#6C7087] mb-4" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                Available Time Slots
              </p>

              {form.practitioner && form.appointment_date ? (
                availableSlots.length > 0 ? (
                  <div className="space-y-6">
                    {afternoonSlots.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[1px] text-[#6C7087] mb-3" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                          Afternoon
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {afternoonSlots.map((slot: any) => (
                            <button
                              key={slot.from_time}
                              type="button"
                              onClick={() => setForm({ ...form, appointment_time: slot.from_time })}
                              className={`px-3 py-2 text-sm border transition-colors ${
                                form.appointment_time === slot.from_time
                                  ? 'bg-[#E500BB] text-white border-[#E500BB]'
                                  : 'bg-white text-[#333333] border-gray-200 hover:border-[#E500BB]'
                              }`}
                              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
                            >
                              {formatTime(slot.from_time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {eveningSlots.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[1px] text-[#6C7087] mb-3" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                          Evening
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {eveningSlots.map((slot: any) => (
                            <button
                              key={slot.from_time}
                              type="button"
                              onClick={() => setForm({ ...form, appointment_time: slot.from_time })}
                              className={`px-3 py-2 text-sm border transition-colors ${
                                form.appointment_time === slot.from_time
                                  ? 'bg-[#E500BB] text-white border-[#E500BB]'
                                  : 'bg-white text-[#333333] border-gray-200 hover:border-[#E500BB]'
                              }`}
                              style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
                            >
                              {formatTime(slot.from_time)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {afternoonSlots.length === 0 && eveningSlots.length === 0 && (
                      <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                        No slots available for this date
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                    No slots available for this date
                  </p>
                )
              ) : (
                <p className="text-sm text-[#6C7087]" style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}>
                  Select a date to view available slots
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      {!showPayment && (
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.push('/patient/appointments/book')}
            className="px-6 py-3 bg-white text-[#333333] text-xs font-bold uppercase tracking-[2px] border border-gray-200 hover:border-[#333333] transition-colors"
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !form.appointment_date ||
              !form.appointment_time ||
              (form.patient_type === 'relative' &&
                (!relative.first_name || !relative.last_name || !relative.dob || !relative.mobile))
            }
            className="px-6 py-3 bg-[#E500BB] text-white text-xs font-bold uppercase tracking-[2px] border border-[#E500BB] hover:bg-[#c400a0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: "var(--font-inter), 'Inter', Arial, sans-serif" }}
          >
            Book Slot
          </button>
        </div>
      )}

      {showPayment && (
        <PaymentSummary
          doctorName={form.practitioner_name}
          department={form.department}
          date={form.appointment_date}
          time={formatTime(form.appointment_time)}
          appointmentType={form.appointment_type}
          consultationFee={CONSULTATION_FEE}
          onPay={handlePay}
          onBack={handleBackToForm}
          isLoading={isPaying}
        />
      )}
    </div>
  );
}
