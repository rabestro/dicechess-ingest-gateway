// Lightweight structural validation of the ingest payload. This is NOT the authoritative
// check — dicechess-analytics replays every game with the engine and rejects illegal ones
// with 422. The gateway only guards that the body is well-formed and that it is a game from
// the expected source (so the gateway can't be used to relay arbitrary forwards).

export interface ValidationResult {
	ok: boolean;
	error?: string;
}

export function validateIngest(payload: unknown, expectedSource: string): ValidationResult {
	if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
		return { ok: false, error: 'body must be a JSON object' };
	}
	const g = payload as Record<string, unknown>;

	if (typeof g.id !== 'string' || g.id.length === 0) {
		return { ok: false, error: 'id (string) is required' };
	}
	if (g.source !== expectedSource) {
		return { ok: false, error: `source must be "${expectedSource}"` };
	}
	if (typeof g.initial_fen !== 'string' || g.initial_fen.length === 0) {
		return { ok: false, error: 'initial_fen (string) is required' };
	}
	if (!Array.isArray(g.turns)) {
		return { ok: false, error: 'turns (array) is required' };
	}
	if (g.events !== undefined && !Array.isArray(g.events)) {
		return { ok: false, error: 'events must be an array when present' };
	}
	return { ok: true };
}
