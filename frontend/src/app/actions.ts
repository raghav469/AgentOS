'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function getApiUrl() {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
  return url.replace(/\/$/, '');
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const apiUrl = getApiUrl();

  try {
    const res = await fetch(`${apiUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const contentType = res.headers.get('content-type');
    const data = contentType && contentType.includes('application/json') ? await res.json() : {};

    if (res.ok && data.token) {
      (await cookies()).set('agentos_auth', data.token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return { success: true };
    } else {
      return { error: data.error || (res.status === 404 ? 'Backend API URL not found. Check API_URL setting.' : 'Invalid credentials') };
    }
  } catch (err: any) {
    console.error('Login error:', err);
    return { error: 'Unable to connect to authentication server' };
  }
}

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!name || !email || !password) {
    return { error: 'All fields are required' };
  }

  const apiUrl = getApiUrl();

  try {
    const res = await fetch(`${apiUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    const contentType = res.headers.get('content-type');
    const data = contentType && contentType.includes('application/json') ? await res.json() : {};

    if (res.ok && data.token) {
      (await cookies()).set('agentos_auth', data.token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });
      return { success: true };
    } else {
      return { error: data.error || (res.status === 404 ? 'Backend API URL not found. Ensure API_URL is set in Vercel settings.' : 'Registration failed') };
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    return { error: 'Unable to connect to authentication server' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('agentos_auth');
  cookieStore.delete('agentos_user');
  redirect('/login');
}

export async function createCheckoutSessionAction() {
  const token = (await cookies()).get('agentos_auth')?.value;
  if (!token) redirect('/login');

  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/api/billing/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (res.ok) {
    const data = await res.json();
    if (data.url) {
      redirect(data.url);
    }
  }
  
  // Fallback if it fails
  redirect('/settings?error=checkout_failed');
}

export async function updateSettingsAction(formData: FormData) {
  const token = (await cookies()).get('agentos_auth')?.value;
  if (!token) redirect('/login');

  const name = formData.get('name') as string;
  const gemini_api_key = formData.get('gemini_api_key') as string;
  const openai_api_key = formData.get('openai_api_key') as string;

  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/api/users/keys`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, gemini_api_key, openai_api_key })
    });

    if (res.ok) {
      return { success: true };
    }
    const data = await res.json();
    return { error: data.error || 'Failed to update settings' };
  } catch (err: any) {
    console.error('Settings update error:', err);
    return { error: 'Unable to connect to server' };
  }
}

