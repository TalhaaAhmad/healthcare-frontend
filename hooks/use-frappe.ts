'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { frappeClient } from '@/lib/frappe-client';
import { handleFrappeError } from '@/lib/error-handler';
import { toast } from 'sonner';

export function useFrappeList(doctype: string, filters?: any, fields?: string[]) {
  return useQuery({
    queryKey: [doctype, 'list', filters, fields],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (fields) params.fields = fields;
        if (filters) params.filters = filters;
        return await frappeClient.get(`/resource/${doctype}`, Object.keys(params).length > 0 ? params : undefined);
      } catch (error: any) {
        const frappeError = handleFrappeError(error);
        toast.error(frappeError.message);
        throw frappeError;
      }
    },
  });
}

export function useFrappeGetOne(doctype: string, name: string) {
  return useQuery({
    queryKey: [doctype, 'get', name],
    queryFn: async () => {
      try {
        return await frappeClient.get(`/resource/${doctype}/${name}`);
      } catch (error: any) {
        const frappeError = handleFrappeError(error);
        toast.error(frappeError.message);
        throw frappeError;
      }
    },
    enabled: !!name,
  });
}

export function useFrappeCreate(doctype: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await frappeClient.post(`/resource/${doctype}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [doctype, 'list'] });
      toast.success('Created successfully');
    },
    onError: (error: any) => {
      const frappeError = handleFrappeError(error);
      toast.error(frappeError.message);
    },
  });
}

export function useFrappeUpdate(doctype: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, data }: { name: string; data: any }) => {
      return await frappeClient.put(`/resource/${doctype}/${name}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [doctype, 'list'] });
      queryClient.invalidateQueries({ queryKey: [doctype, 'get', variables.name] });
      toast.success('Updated successfully');
    },
    onError: (error: any) => {
      const frappeError = handleFrappeError(error);
      toast.error(frappeError.message);
    },
  });
}

// Use Frappe's set_value method for reliable field updates
export function useFrappeSetValue(doctype: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, fieldname, value }: { name: string; fieldname: string; value: any }) => {
      return await frappeClient.post('/method/frappe.client.set_value', {
        doctype,
        name,
        fieldname,
        value,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [doctype, 'list'] });
      queryClient.invalidateQueries({ queryKey: [doctype, 'get', variables.name] });
      toast.success('Updated successfully');
    },
    onError: (error: any) => {
      const frappeError = handleFrappeError(error);
      toast.error(frappeError.message);
    },
  });
}

// Use Frappe's document cancel method
export function useFrappeCancel(doctype: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      return await frappeClient.post('/method/frappe.client.cancel', {
        doctype,
        name,
      });
    },
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: [doctype, 'list'] });
      queryClient.invalidateQueries({ queryKey: [doctype, 'get', name] });
      toast.success('Cancelled successfully');
    },
    onError: (error: any) => {
      const frappeError = handleFrappeError(error);
      toast.error(frappeError.message);
    },
  });
}

// Use Frappe's save method for document updates with validation
export function useFrappeSave(doctype: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: any) => {
      return await frappeClient.post('/method/frappe.client.save', { doc });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [doctype, 'list'] });
      queryClient.invalidateQueries({ queryKey: [doctype, 'get', variables.name] });
      toast.success('Saved successfully');
    },
    onError: (error: any) => {
      const frappeError = handleFrappeError(error);
      toast.error(frappeError.message);
    },
  });
}

// Use Healthcare module's update_status method for Patient Appointment
export function usePatientAppointmentUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      return await frappeClient.post('/method/healthcare.healthcare.doctype.patient_appointment.patient_appointment.update_status', {
        appointment_id: appointmentId,
        status,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['Patient Appointment', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['Patient Appointment', 'get', variables.appointmentId] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      const frappeError = handleFrappeError(error);
      toast.error(frappeError.message);
    },
  });
}

export function useFrappeDelete(doctype: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      return await frappeClient.delete(`/resource/${doctype}/${name}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [doctype, 'list'] });
      toast.success('Deleted successfully');
    },
    onError: (error: any) => {
      const frappeError = handleFrappeError(error);
      toast.error(frappeError.message);
    },
  });
}

export function useDoctorList() {
  return useQuery({
    queryKey: ['Healthcare Practitioner', 'list'],
    queryFn: () => frappeClient.get('/resource/Healthcare Practitioner', {
      fields: ['name', 'practitioner_name', 'designation', 'department', 'image', 'status'],
      filters: [['status', '=', 'Active']]
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useLiveAppointments(patientId: string) {
  return useQuery({
    queryKey: ['Patient Appointment', 'live', patientId],
    queryFn: () => frappeClient.get('/resource/Patient Appointment', {
      fields: ['name', 'patient', 'patient_name', 'practitioner_name', 'department', 'appointment_date', 'appointment_time', 'status', 'title'],
      filters: [['patient', '=', patientId]],
      order_by: 'creation desc',
      limit_page_length: 10,
    }),
    enabled: !!patientId,
    refetchInterval: 30000, // 30 seconds
  });
}

// Fetch all appointments for a user and their relatives (by email)
export function useUserAppointments(email: string) {
  return useQuery({
    queryKey: ['Patient Appointment', 'user', email],
    queryFn: async () => {
      const res = await fetch(`/api/patient/appointments?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json();
    },
    enabled: !!email,
    refetchInterval: 30000,
  });
}

// Fetch practitioner schedule to get available time slots
export function usePractitionerSchedule(practitionerId: string) {
  return useQuery({
    queryKey: ['Practitioner Schedule', practitionerId],
    queryFn: async () => {
      // Fetch the practitioner document to get linked schedules from child table
      const practitionerRes = await frappeClient.get(`/resource/Healthcare Practitioner/${practitionerId}`);
      const practitioner = practitionerRes.data || {};
      const scheduleLinks = practitioner.practitioner_schedules || [];
      if (scheduleLinks.length === 0) return { data: null };
      // Fetch full schedule with time_slots child table
      const scheduleName = scheduleLinks[0].schedule;
      return frappeClient.get(`/resource/Practitioner Schedule/${scheduleName}`);
    },
    enabled: !!practitionerId,
    staleTime: 0,
    gcTime: 0,
  });
}

// Fetch existing appointments for a practitioner on a specific date
export function usePractitionerAppointments(practitionerId: string, date: string) {
  return useQuery({
    queryKey: ['Patient Appointment', 'practitioner', practitionerId, date],
    queryFn: () => frappeClient.get('/resource/Patient Appointment', {
      fields: ['name', 'appointment_time', 'status'],
      filters: [
        ['practitioner', '=', practitionerId],
        ['appointment_date', '=', date],
        ['status', '!=', 'Cancelled'],
      ],
    }),
    enabled: !!practitionerId && !!date,
    staleTime: 30 * 1000,
  });
}

// PayFast payment hook
export function usePayFastPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(async ({
    basketId,
    amount,
    currencyCode = 'PKR',
    formData,
  }: {
    basketId: string;
    amount: number;
    currencyCode?: string;
    formData: Record<string, string>;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const tokenRes = await fetch('/api/payment/payfast-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          amount,
          currency_code: currencyCode,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.token) {
        throw new Error(tokenData.error || 'Failed to get payment token');
      }

      // Create and submit PayFast form
      const formEl = document.createElement('form');
      formEl.method = 'POST';
      formEl.action = process.env.NEXT_PUBLIC_PAYFAST_POST_URL || 'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction';

      const fields: Record<string, string> = {
        CURRENCY_CODE: currencyCode,
        MERCHANT_ID: tokenData.merchant_id,
        MERCHANT_NAME: 'Healthcare V2',
        TOKEN: tokenData.token,
        BASKET_ID: basketId,
        TXNAMT: amount.toFixed(2),
        ORDER_DATE: new Date().toISOString().replace('T', ' ').slice(0, 19),
        SUCCESS_URL: `${window.location.origin}/api/payment/payfast-success`,
        FAILURE_URL: `${window.location.origin}/payment/failed`,
        CHECKOUT_URL: `${window.location.origin}/payment/checkout`,
        SIGNATURE: 'SOME-RANDOM-STRING',
        VERSION: 'MERCHANT-CART-0.1',
        PROCCODE: '00',
        TRAN_TYPE: 'ECOMM_PURCHASE',
        STORE_ID: '',
        RECURRING_TXN: '',
        ...formData,
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
      setError(err.message || 'Payment initiation failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { initiatePayment, isLoading, error };
}
