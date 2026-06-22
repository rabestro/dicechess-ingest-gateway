// Minimal in-memory fixed-window rate limiter, keyed per client IP. Good enough for a
// single-instance gateway; if the gateway is ever scaled out, move this to a shared store.

interface Window {
	count: number;
	resetAt: number;
}

export class RateLimiter {
	private readonly max: number;
	private readonly windowMs: number;
	private readonly hits = new Map<string, Window>();

	constructor(max: number, windowMs: number) {
		this.max = max;
		this.windowMs = windowMs;
	}

	/** Returns true if the request is allowed; false if the key is over its limit. */
	allow(key: string, now: number = Date.now()): boolean {
		const w = this.hits.get(key);
		if (!w || now >= w.resetAt) {
			this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
			this.sweep(now);
			return true;
		}
		if (w.count >= this.max) return false;
		w.count++;
		return true;
	}

	/** Drop expired windows so the map does not grow unbounded. */
	private sweep(now: number): void {
		if (this.hits.size < 1000) return;
		for (const [k, w] of this.hits) {
			if (now >= w.resetAt) this.hits.delete(k);
		}
	}
}
