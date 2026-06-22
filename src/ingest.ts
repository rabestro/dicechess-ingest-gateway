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
	timeoutMs = 10_000,
): Promise<ForwardResult> {
	// Bound the upstream call so an unreachable/firewalled analytics endpoint fails fast
	// with a clear error instead of hanging until the edge times out with an opaque 502.
	const r = await fetch(`${baseUrl}/api/games`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify(payload),
		signal: AbortSignal.timeout(timeoutMs),
	});
	return { status: r.status, body: await r.text() };
}
