import { NextRequest, NextResponse } from 'next/server';

const NEURAL_LINK_URL = process.env.NEURAL_LINK_URL ?? 'http://localhost:3001';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { message, agentId, command, params } = body;

    let endpoint = '/ton';
    let payload: Record<string, unknown>;

    if (agentId === 'BRAIN') {
      endpoint = '/brain';
      payload = { message: String(message ?? command ?? '') };
    } else if (agentId && command) {
      endpoint = '/dispatch';
      payload = { agentId, command, params: params ?? {} };
    } else {
      endpoint = '/ton';
      payload = { message: String(message ?? command ?? '') };
    }

    if (!payload.message && endpoint !== '/dispatch') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const response = await fetch(`${NEURAL_LINK_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEURAL_API_KEY ? { 'x-api-key': process.env.NEURAL_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });

    const data: unknown = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'neural-link unreachable';
    return NextResponse.json(
      { error: msg, hint: 'Ensure neural-link is running: cd welloff-neural-link && npm run dev' },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') ?? '/health';
  const allowed = ['/health', '/memory', '/metrics', '/scheduler', '/a2a/log'];
  if (!allowed.includes(path)) {
    return NextResponse.json({ error: 'path not allowed', allowed }, { status: 400 });
  }
  try {
    const response = await fetch(`${NEURAL_LINK_URL}${path}`, {
      headers: process.env.NEURAL_API_KEY ? { 'x-api-key': process.env.NEURAL_API_KEY } : {},
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ error: 'neural-link unreachable' }, { status: 503 });
  }
}
