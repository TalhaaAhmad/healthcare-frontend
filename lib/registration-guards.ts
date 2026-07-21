import { AxiosInstance } from 'axios';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Trim and collapse whitespace; keep dialing format as entered. */
export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, ' ');
}

/** Digits-only form for comparing differently formatted numbers. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export class DuplicateIdentityError extends Error {
  constructor(
    message: string,
    public field: 'email' | 'mobile'
  ) {
    super(message);
    this.name = 'DuplicateIdentityError';
  }
}

async function listPatients(
  frappe: AxiosInstance,
  filters: unknown[][]
): Promise<Array<{ name: string; email?: string; mobile?: string; user_id?: string }>> {
  const res = await frappe.get('/resource/Patient', {
    params: {
      fields: JSON.stringify(['name', 'email', 'mobile', 'user_id']),
      filters: JSON.stringify(filters),
      limit_page_length: 20,
    },
  });
  return res.data?.data || [];
}

export async function findUserByEmail(
  frappe: AxiosInstance,
  email: string
): Promise<boolean> {
  try {
    await frappe.get(`/resource/User/${encodeURIComponent(email)}`);
    return true;
  } catch (err: any) {
    if (err?.response?.status === 404) return false;
    // Some Frappe setups return 403/417 for missing users — treat as not found only on 404
    if (err?.response?.status === 403) {
      // Fall back to list filter
      const res = await frappe.get('/resource/User', {
        params: {
          fields: JSON.stringify(['name', 'email']),
          filters: JSON.stringify([['email', '=', email]]),
          limit_page_length: 1,
        },
      });
      return (res.data?.data?.length || 0) > 0;
    }
    throw err;
  }
}

export async function findPatientByEmail(
  frappe: AxiosInstance,
  email: string,
  excludePatientId?: string
) {
  const patients = await listPatients(frappe, [['email', '=', email]]);
  return patients.find((p) => p.name !== excludePatientId) || null;
}

/**
 * Find a patient whose mobile matches exactly, or whose digits match
 * (covers formatting differences like spaces/dashes).
 */
export async function findPatientByMobile(
  frappe: AxiosInstance,
  mobile: string,
  excludePatientId?: string
) {
  const normalized = normalizePhone(mobile);
  const digits = phoneDigits(normalized);

  const exact = await listPatients(frappe, [['mobile', '=', normalized]]);
  const exactHit = exact.find((p) => p.name !== excludePatientId);
  if (exactHit) return exactHit;

  if (!digits || digits.length < 7) return null;

  // Broader scan: patients whose mobile contains the last 7+ digits
  const suffix = digits.slice(-10);
  const candidates = await listPatients(frappe, [['mobile', 'like', `%${suffix}%`]]);
  return (
    candidates.find((p) => {
      if (p.name === excludePatientId) return false;
      return phoneDigits(p.mobile || '') === digits;
    }) || null
  );
}

/**
 * Ensures email and mobile are not already used by another User or Patient.
 * Throws DuplicateIdentityError when a conflict is found.
 */
export async function assertUniqueEmailAndPhone(
  frappe: AxiosInstance,
  options: {
    email: string;
    mobile: string;
    excludePatientId?: string;
    /** When false, skip User doctype check (e.g. profile update of patient only). */
    checkUser?: boolean;
  }
): Promise<void> {
  const email = normalizeEmail(options.email);
  const mobile = normalizePhone(options.mobile);
  const checkUser = options.checkUser !== false;

  if (!email) {
    throw new DuplicateIdentityError('Email is required', 'email');
  }
  if (!mobile) {
    throw new DuplicateIdentityError('Mobile number is required', 'mobile');
  }

  if (checkUser) {
    const userExists = await findUserByEmail(frappe, email);
    if (userExists) {
      throw new DuplicateIdentityError(
        'An account with this email already exists. Please log in instead.',
        'email'
      );
    }
  }

  const patientByEmail = await findPatientByEmail(
    frappe,
    email,
    options.excludePatientId
  );
  if (patientByEmail) {
    throw new DuplicateIdentityError(
      'This email is already registered to another patient.',
      'email'
    );
  }

  const patientByMobile = await findPatientByMobile(
    frappe,
    mobile,
    options.excludePatientId
  );
  if (patientByMobile) {
    throw new DuplicateIdentityError(
      'This mobile number is already registered to another patient.',
      'mobile'
    );
  }
}
