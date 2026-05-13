import { NextRequest, NextResponse } from 'next/server';
import { getFrappeCookieClient } from '@/lib/frappe-client';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Forward the browser's cookies to Frappe (for CSRF/session continuity)
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await getFrappeCookieClient().post('/method/login', {
      usr: email,
      pwd: password,
    }, {
      headers: {
        'Cookie': cookieHeader,
      },
    });

    const { full_name, sid, user_id } = response.data;

    // Collect all Set-Cookie headers from Frappe and forward them to the browser
    const frappeCookies = response.headers['set-cookie'] || [];
    const cookiesToForward = Array.isArray(frappeCookies) ? frappeCookies : [frappeCookies];

    const jsonResponse = NextResponse.json({
      success: true,
      user: { full_name, email: user_id },
      message: 'Login successful'
    });

    // Forward each Set-Cookie header from Frappe to the browser
    cookiesToForward.forEach((cookie) => {
      if (cookie) {
        jsonResponse.headers.append('Set-Cookie', cookie);
      }
    });

    return jsonResponse;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid credentials', detail: error.response?.data },
      { status: 401 }
    );
  }
}
