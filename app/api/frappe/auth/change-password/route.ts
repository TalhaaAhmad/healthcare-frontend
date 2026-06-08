import { NextRequest, NextResponse } from 'next/server';
import { getFrappeCookieClient } from '@/lib/frappe-client';

export async function POST(request: NextRequest) {
  try {
    const { old_password, new_password } = await request.json();

    if (!old_password || !new_password) {
      return NextResponse.json(
        { error: 'Both old_password and new_password are required' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get('cookie') || '';

    const response = await getFrappeCookieClient().post(
      '/method/frappe.core.doctype.user.user.update_password',
      {
        old_password,
        new_password,
      },
      {
        headers: {
          Cookie: cookieHeader,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      data: response.data,
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    let message = 'Failed to update password';
    if (error.response?.data?._server_messages) {
      try {
        const parsed = JSON.parse(error.response.data._server_messages);
        if (Array.isArray(parsed) && parsed.length > 0) message = parsed[0];
      } catch { /* ignore */ }
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    }

    return NextResponse.json(
      { error: typeof message === 'string' ? message : 'Failed to update password' },
      { status }
    );
  }
}
