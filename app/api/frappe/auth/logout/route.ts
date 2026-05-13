import { NextRequest, NextResponse } from 'next/server';
import { getFrappeCookieClient } from '@/lib/frappe-client';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await getFrappeCookieClient().post('/method/logout', {}, {
      headers: { 'Cookie': cookieHeader },
    });

    // Forward Frappe's Set-Cookie headers (clears session cookies)
    const frappeCookies = response.headers['set-cookie'] || [];
    const cookiesToForward = Array.isArray(frappeCookies) ? frappeCookies : [frappeCookies];

    const jsonResponse = NextResponse.json({ success: true, message: 'Logout successful' });

    cookiesToForward.forEach((cookie) => {
      if (cookie) jsonResponse.headers.append('Set-Cookie', cookie);
    });

    return jsonResponse;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Logout failed', detail: error.response?.data },
      { status: 500 }
    );
  }
}
