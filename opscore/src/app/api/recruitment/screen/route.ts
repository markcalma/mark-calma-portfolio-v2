import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { triggerWebhook } from '@/lib/n8n';

export async function POST(request: NextRequest) {
  const { jobId } = await request.json();

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  try {
    const result = await triggerWebhook('recruitment/screen', { jobId });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
