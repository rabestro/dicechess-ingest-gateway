// Configuration from the environment. Fails loud on missing required secrets rather
// than starting a gateway that would 401 on every forward. For local dev, run with
// `node --env-file=.env src/server.ts` (Node 26 reads the .env file natively).

function requireEnv(name: string): string {
	const v = (process.env[name] ?? '').trim();
	if (!v) throw new Error(`Missing required env var: ${name}`);
	return v;
}

function intEnv(name: string, fallback: number): number {
	const raw = process.env[name];
	if (raw == null || raw.trim() === '') return fallback;
	const n = Number(raw);
	if (!Number.isInteger(n) || n <= 0) {
		throw new Error(`${name} must be a positive integer, got: ${JSON.stringify(raw)}`);
	}
	return n;
}

function parseOrigins(raw: string): string[] {
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

const DEFAULT_ORIGINS = [
	'https://play.jc.id.lv',
	'https://dicechess-play.pages.dev',
	'*.dicechess-play.pages.dev', // Cloudflare Pages preview deployments
	'http://localhost:5173',
	'http://localhost:5174',
].join(',');

export const config = {
	port: intEnv('PORT', 8080),
	/** Upstream analytics ingest, e.g. https://sync.jc.id.lv (POST-only). */
	analyticsBaseUrl: (process.env.ANALYTICS_BASE_URL ?? 'https://sync.jc.id.lv').replace(/\/+$/, ''),
	/** Bearer token for analytics — held ONLY here, never in the browser. Required. */
	ingestToken: requireEnv('INGEST_TOKEN'),
	/** Allowed browser origins (exact, or `*.suffix` for subdomain wildcards). */
	allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS),
	/** Only relay games from this source; reject anything else. */
	expectedSource: (process.env.EXPECTED_SOURCE ?? 'playsite').trim(),
	maxBodyBytes: intEnv('MAX_BODY_BYTES', 256 * 1024),
	rateLimitMax: intEnv('RATE_LIMIT_MAX', 60),
	rateLimitWindowMs: intEnv('RATE_LIMIT_WINDOW_MS', 60_000),
};
