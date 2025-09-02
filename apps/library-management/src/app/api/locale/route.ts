import { NextRequest, NextResponse } from 'next/server';
import { setUserLocale } from '@/i18n/locale';
import { validateLocale } from '@/lib/locale-cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale } = body;

    // Validate the locale
    if (!locale || !validateLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    // Set the locale in server-side cookies
    await setUserLocale(locale);

    return NextResponse.json(
      { message: 'Locale updated successfully', locale },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to update locale:', error);
    return NextResponse.json(
      { error: 'Failed to update locale' },
      { status: 500 }
    );
  }
}