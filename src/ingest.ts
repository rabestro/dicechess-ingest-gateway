// Forward a game to dicechess-analytics with the Bearer token (held server-side only).
// Adapted from dicechess-sync src/ingest.ts. Idempotent upstream: 201 created, 200 already
// existed, 422 validation failed.

export interface ForwardResult {
	status: number;
	body: string;
}

export async function forwardGame(
	baseUrl: string,
	token: string,
	payload: unknown,
): Promise<ForwardResult> {
	const r = await fetch(`${baseUrl}/api/games`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify(payload),
	});
	return { status: r.status, body: await r.text() };
}
