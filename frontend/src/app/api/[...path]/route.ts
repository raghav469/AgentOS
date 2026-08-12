import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const backendUrl = process.env.API_URL || 'http://127.0.0.1:3001';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams.path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams.path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams.path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return proxyRequest(req, resolvedParams.path);
}

async function proxyRequest(req: NextRequest, pathArray: string[]) {
  const path = pathArray.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const query = searchParams ? `?${searchParams}` : '';
  
  const targetUrl = `${backendUrl}/api/${path}${query}`;
  const token = (await cookies()).get('agentos_auth')?.value;
  
  const headers = new Headers(req.headers);
  headers.delete('host');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      redirect: 'manual',
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await req.text();
      fetchOptions.body = body;
    }

    const res = await fetch(targetUrl, fetchOptions);
    
    // We construct a new response to forward back to the client
    const responseHeaders = new Headers(res.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('API Proxy Error:', err);
    return NextResponse.json({ error: 'Internal Server Error (Proxy)' }, { status: 500 });
  }
}
