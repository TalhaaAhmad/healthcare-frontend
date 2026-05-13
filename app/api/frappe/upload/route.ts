import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
import { getFrappeServerClient } from '@/lib/frappe-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const doctype = formData.get('doctype') as string;
    const docname = formData.get('docname') as string;

    if (!file || !doctype || !docname) {
      return NextResponse.json(
        { error: 'Missing required fields: file, doctype, docname' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create form-data for Frappe
    const frappeForm = new FormData();
    frappeForm.append('file', buffer, file.name);
    frappeForm.append('doctype', doctype);
    frappeForm.append('docname', docname);
    frappeForm.append('is_private', '1');

    const response = await getFrappeServerClient().post(
      '/method/upload_file',
      frappeForm,
      {
        headers: {
          ...frappeForm.getHeaders(),
          'Authorization': `token ${process.env.FRAPPE_API_KEY}:${process.env.FRAPPE_API_SECRET}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
