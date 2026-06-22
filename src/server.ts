// dicechess-ingest-gateway
//
// A tiny token-holding relay between the public play site and dicechess-analytics.
// The browser POSTs a finished game here (no auth); the gateway holds the analytics
// INGEST_TOKEN, applies CORS + rate limiting + a structural check, and forwards to
// sync.jc.id.lv with the Bearer. The token never reaches the browser (ADR-0005).

import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from './config.ts';
import { isOriginAllowed } from './cors.ts';
import { validateIngest } from './validate.ts';
import { RateLimiter } from './ratelimit.ts';
import { forwardGame } from './ingest.ts';

const limiter = new RateLimiter(config.rateLimitMax, config.rateLimitWindowMs);

function applyCors(res: ServerResponse, origin: string | undefined): boolean {
	if (!isOriginAllowed(origin, config.allowedOrigins)) return false;
	res.setHeader('Access-Control-Allow-Origin', origin as string);
	res.setHeader('Vary', 'Origin');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	res.setHeader('Access-Control-Max-Age', '86400');
	return true;
}

function json(res: ServerResponse, status: number, obj: unknown): void {
	res.writeHead(status, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(obj));
}

function clientIp(req: IncomingMessage): string {
	const xff = req.headers['x-forwarded-for'];
	if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0]!.trim();
	return req.socket.remoteAddress ?? 'unknown';
}

async function readBody(req: IncomingMessage, limit: number): Promise<Buffer | null> {
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of req) {
		size += (chunk as Buffer).length;
		if (size > limit) return null; // too large
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks);
}

const server = http.createServer(async (req, res) => {
	const origin = req.headers.origin;
	const path = new URL(req.url ?? '/', 'http://localhost').pathname;

	// Health check (used by Koyeb) — no CORS needed.
	if (req.method === 'GET' && (path === '/health' || path === '/')) {
		return json(res, 200, { status: 'ok', service: 'dicechess-ingest-gateway' });
	}

	const corsOk = applyCors(res, origin);

	if (req.method === 'OPTIONS') {
		res.writeHead(corsOk ? 204 : 403);
		return res.end();
	}

	if (path !== '/api/games') return json(res, 404, { error: 'not found' });
	if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });

	// A browser request carries an Origin; if present it must be allow-listed.
	if (origin !== undefined && !corsOk) return json(res, 403, { error: 'origin not allowed' });

	if (!limiter.allow(clientIp(req))) return json(res, 429, { error: 'rate limited' });

	const raw = await readBody(req, config.maxBodyBytes);
	if (raw === null) return json(res, 413, { error: 'payload too large' });

	let payload: unknown;
	try {
		payload = JSON.parse(raw.toString('utf8'));
	} catch {
		return json(res, 400, { error: 'invalid JSON' });
	}

	const v = validateIngest(payload, config.expectedSource);
	if (!v.ok) return json(res, 422, { error: v.error });

	try {
		const r = await forwardGame(config.analyticsBaseUrl, config.ingestToken, payload);
		// Pass through the meaningful analytics statuses; collapse anything else (auth/5xx) to 502
		// so the client treats it as a transient error and retries from its outbox.
		const status = r.status === 200 || r.status === 201 || r.status === 422 ? r.status : 502;
		res.writeHead(status, { 'Content-Type': 'application/json' });
		return res.end(r.body || JSON.stringify({ upstream_status: r.status }));
	} catch {
		return json(res, 502, { error: 'upstream unreachable' });
	}
});

server.listen(config.port, () => {
	console.log(
		`[ingest-gateway] listening on :${config.port} → ${config.analyticsBaseUrl} ` +
			`(origins: ${config.allowedOrigins.join(', ')})`,
	);
});
