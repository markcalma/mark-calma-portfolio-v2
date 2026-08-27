import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { triggerWebhook } from '@/lib/n8n';

export async function POST(request: NextRequest) {
  const { applicantId, applicantName, jobId } = await request.json();

  if (!applicantId || !applicantName || !jobId) {
    return NextResponse.json({ error: 'applicantId, applicantName, and jobId are required' }, { status: 400 });
  }

  try {
    const result = await triggerWebhook('recruitment/schedule', {
      applicantId,
      applicantName,
      jobId,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
