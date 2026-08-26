export async function triggerWebhook(path: string, payload: Record<string, unknown>): Promise<unknown> {
  const base = process.env.N8N_BASE_URL;
  if (!base) throw new Error('N8N_BASE_URL env var not set');

  const res = await fetch(`${base}/webhook/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n webhook failed: ${res.status} - ${text}`);
  }

  return res.json();
}
