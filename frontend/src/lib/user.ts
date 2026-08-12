import { cookies } from 'next/headers';

export async function getUserProfile() {
  const token = (await cookies()).get('agentos_auth')?.value;
  if (!token) return null;

  const apiUrl = process.env.API_URL || 'http://127.0.0.1:3001';
  try {
    const res = await fetch(`${apiUrl}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
  }
  return null;
}
