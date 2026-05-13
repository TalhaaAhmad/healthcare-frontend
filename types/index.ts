// Patient Types
export interface Patient {
  name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  patient_name: string;
  sex: 'Male' | 'Female' | 'Other';
  dob: string;
  blood_group?: string;
  mobile: string;
  email?: string;
  uid?: string;
  status: 'Active' | 'Inactive' | 'Disabled';
  allergies?: string;
  medical_history?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  image?: string;
}

export interface PatientRegistrationData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  sex: string;
  dob: string;
  blood_group?: string;
  mobile: string;
  email?: string;
  uid?: string;
  patient_name?: string;
  status?: string;
}

// Healthcare Practitioner Types
export interface HealthcarePractitioner {
  name: string;
  practitioner_name: string;
  department: string;
  designation: string;
  status: 'Active' | 'Inactive';
  image?: string;
  bio?: string;
}

// Appointment Types
export interface PatientAppointment {
  name: string;
  patient: string;
  patient_name: string;
  practitioner: string;
  practitioner_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type?: string;
  duration?: number;
  status: 'Scheduled' | 'Open' | 'Closed' | 'Cancelled' | 'No Show';
  notes?: string;
  mode_of_payment?: string;
  paid_amount?: number;
  service_unit?: string;
  invoiced?: number;
  reminded?: number;
}

export interface AppointmentBookingData {
  patient: string;
  patient_name: string;
  practitioner: string;
  practitioner_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type?: string;
  duration?: number;
  status?: string;
  notes?: string;
  mode_of_payment?: string;
  paid_amount?: number;
  service_unit?: string;
}

// Patient Encounter Types
export interface PatientEncounter {
  name: string;
  patient: string;
  practitioner: string;
  appointment?: string;
  encounter_date: string;
  encounter_time: string;
  department: string;
  status: 'Open' | 'Closed' | 'Cancelled';
  symptoms?: Complaint[];
  diagnosis?: Diagnosis[];
  drug_prescription?: DrugPrescription[];
  lab_test_prescription?: LabTestPrescription[];
  procedure_prescription?: ProcedurePrescription[];
  bp?: string;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

export interface Complaint {
  complaint: string;
  duration?: string;
  severity?: string;
}

export interface Diagnosis {
  diagnosis: string;
  type?: string;
}

export interface DrugPrescription {
  drug_code: string;
  drug_name: string;
  dosage?: string;
  period?: string;
  dosage_form?: string;
}

export interface LabTestPrescription {
  test_code: string;
  test_name: string;
  comments?: string;
}

export interface ProcedurePrescription {
  procedure: string;
  comments?: string;
}

// Lab Test Types
export interface LabTest {
  name: string;
  template: string;
  patient: string;
  patient_name?: string;
  practitioner?: string;
  date: string;
  status: 'Open' | 'Completed' | 'Cancelled';
  result_date?: string;
  prescription?: string;
  notes?: string;
  normal_test_items?: LabTestResultItem[];
}

export interface LabTestResultItem {
  lab_test_name: string;
  result_value?: string;
  normal_range?: string;
  unit?: string;
}

// Billing Types
export interface SalesInvoice {
  name: string;
  customer: string;
  patient?: string;
  posting_date: string;
  due_date: string;
  items: SalesInvoiceItem[];
  grand_total: number;
  outstanding_amount: number;
  status: 'Draft' | 'Return' | 'Credit Note' | 'Submitted' | 'Paid' | 'Overdue' | 'Cancelled';
  taxes?: SalesInvoiceTax[];
  remarks?: string;
  appointment?: string;
}

export interface SalesInvoiceItem {
  item_code: string;
  item_name: string;
  description?: string;
  qty: number;
  rate: number;
  amount: number;
  income_account?: string;
  cost_center?: string;
}

export interface SalesInvoiceTax {
  charge_type: string;
  account_head: string;
  rate: number;
  description?: string;
}

export interface PaymentEntry {
  name: string;
  payment_type: string;
  party_type: string;
  party: string;
  posting_date: string;
  paid_amount: number;
  received_amount: number;
  mode_of_payment: string;
  references?: PaymentReference[];
  paid_from?: string;
  paid_to?: string;
}

export interface PaymentReference {
  reference_doctype: string;
  reference_name: string;
  allocated_amount: number;
}

// Schedule Types
export interface PractitionerSchedule {
  name: string;
  schedule_name: string;
  practitioner: string;
  time_slots?: TimeSlot[];
}

export interface TimeSlot {
  from_time: string;
  to_time: string;
  day: string;
}

// File Attachment Types
export interface FrappeFile {
  name: string;
  file_name: string;
  file_url: string;
  is_private: number;
  attached_to_doctype?: string;
  attached_to_name?: string;
}

// API Response Types
export interface FrappeListResponse<T> {
  data: T[];
}

export interface FrappeSingleResponse<T> {
  data: T;
}

export interface FrappeErrorResponse {
  exc_type?: string;
  message: string;
  exception?: string;
}

// Dashboard Types
export interface PractitionerDashboardStats {
  total_appointments_today: number;
  completed: number;
  pending: number;
  cancelled: number;
  new_patients_this_month?: number;
  total_encounters_this_month?: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    full_name: string;
    email: string;
  };
  message: string;
}

export interface User {
  email: string;
  first_name: string;
  last_name?: string;
  user_type?: string;
  roles?: { role: string }[];
}
