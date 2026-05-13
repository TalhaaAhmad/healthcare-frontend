import { NextRequest, NextResponse } from 'next/server';
import { getFrappeServerClient, getFrappeCookieClient } from '@/lib/frappe-client';

const FRAPPE_BASE_URL = process.env.FRAPPE_BASE_URL;

// Allowed DocTypes for security (whitelist approach)
const ALLOWED_DOCTYPES = [
  'Patient', 'Patient Appointment', 'Healthcare Practitioner',
  'Patient Encounter', 'Drug Prescription', 'Lab Test',
  'Sales Invoice', 'Payment Entry', 'Medical Department',
  'Practitioner Schedule', 'Vital Signs', 'Complaint',
  'Diagnosis', 'Lab Test Template', 'Appointment Type',
  'Healthcare Service Unit', 'Therapy Plan', 'Therapy Session',
  'Clinical Procedure', 'Procedure Prescription', 'User',
];

function isAllowed(path: string): boolean {
  // Allow method endpoints
  if (path.startsWith('/method/')) return true;

  // Check DocType whitelist
  const doctypeMatch = path.match(/\/resource\/([^/?]+)/);
  if (doctypeMatch) {
    return ALLOWED_DOCTYPES.includes(decodeURIComponent(doctypeMatch[1]));
  }

  return false;
}

/**
 * Determine if a request should use cookie-based auth (session) or API Key auth.
 * Only auth/session endpoints use cookie auth. All data queries use API Key auth
 * to bypass user permission restrictions.
 */
function shouldUseCookieAuth(path: string, cookieHeader: string): boolean {
  // Session-dependent method endpoints always use cookie auth
  if (path.startsWith('/method/frappe.auth.get_logged_user')) return true;
  if (path.startsWith('/method/frappe.sessions')) return true;

  return false;
}

async function handleRequest(
  request: NextRequest,
  method: string
) {
  try {
    const path = '/' + (request.nextUrl.pathname.replace('/api/frappe', '').replace(/^\//, ''));

    if (!isAllowed(path)) {
      return NextResponse.json(
        { error: 'Access to this resource is not allowed' },
        { status: 403 }
      );
    }

    const cookieHeader = request.headers.get('cookie') || '';
    const isMutating = method === 'POST' || method === 'PUT' || method === 'DELETE';

    // For GET requests, use cookie auth only for auth/session endpoints.
    // All other requests (including mutating) use API Key auth to avoid
    // CSRF and permission issues.
    let useCookieAuth = false;
    if (!isMutating) {
      useCookieAuth = shouldUseCookieAuth(path, cookieHeader);
    }

    let response;
    const url = `${FRAPPE_BASE_URL}/api${path}${request.nextUrl.search}`;

    // Build headers: forward cookies for cookie-auth GET requests
    const headers: Record<string, string> = {};
    if (useCookieAuth && cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const axiosConfig = Object.keys(headers).length > 0 ? { headers } : {};

    console.log(`[Proxy] ${method} ${path} | useCookieAuth=${useCookieAuth} | isMutating=${isMutating}`);

    const client = useCookieAuth && cookieHeader
      ? getFrappeCookieClient()
      : getFrappeServerClient();

    switch (method) {
      case 'GET':
        response = await client.get(url, axiosConfig);
        break;
      case 'POST':
        const postBody = await request.json().catch(() => ({}));
        console.log(`[Proxy] POST body:`, JSON.stringify(postBody).substring(0, 200));
        response = await client.post(url, postBody, axiosConfig);
        console.log(`[Proxy] POST response status:`, response.status, 'data:', JSON.stringify(response.data).substring(0, 200));
        break;
      case 'PUT':
        const putBody = await request.json().catch(() => ({}));
        console.log(`[Proxy] PUT body:`, JSON.stringify(putBody));
        response = await client.put(url, putBody, axiosConfig);
        console.log(`[Proxy] PUT response status:`, response.status);
        break;
      case 'DELETE':
        response = await client.delete(url, axiosConfig);
        break;
      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // For cookie-auth requests, forward Set-Cookie headers from Frappe
    if (useCookieAuth) {
      const frappeCookies = response.headers['set-cookie'];
      if (frappeCookies) {
        const cookiesToForward = Array.isArray(frappeCookies) ? frappeCookies : [frappeCookies];
        const jsonResponse = NextResponse.json(response.data);
        cookiesToForward.forEach((cookie) => {
          if (cookie) jsonResponse.headers.append('Set-Cookie', cookie);
        });
        return jsonResponse;
      }
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: error.message };

    return NextResponse.json(
      { error: data.message || 'Internal server error', detail: data },
      { status }
    );
  }
}

export const GET = (req: NextRequest) => handleRequest(req, 'GET');
export const POST = (req: NextRequest) => handleRequest(req, 'POST');
export const PUT = (req: NextRequest) => handleRequest(req, 'PUT');
export const DELETE = (req: NextRequest) => handleRequest(req, 'DELETE');
