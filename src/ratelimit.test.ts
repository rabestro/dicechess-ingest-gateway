import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiter } from './ratelimit.ts';

test('allows up to max within the window, then blocks', () => {
	const rl = new RateLimiter(3, 1000);
	const t0 = 1_000_000;
	assert.equal(rl.allow('ip1', t0), true);
	assert.equal(rl.allow('ip1', t0), true);
	assert.equal(rl.allow('ip1', t0), true);
	assert.equal(rl.allow('ip1', t0), false); // 4th in the window
});

test('tracks keys independently', () => {
	const rl = new RateLimiter(1, 1000);
	const t0 = 2_000_000;
	assert.equal(rl.allow('a', t0), true);
	assert.equal(rl.allow('a', t0), false);
	assert.equal(rl.allow('b', t0), true); // separate key
});

test('resets after the window elapses', () => {
	const rl = new RateLimiter(1, 1000);
	const t0 = 3_000_000;
	assert.equal(rl.allow('ip', t0), true);
	assert.equal(rl.allow('ip', t0 + 500), false); // still in window
	assert.equal(rl.allow('ip', t0 + 1000), true); // window elapsed
});
