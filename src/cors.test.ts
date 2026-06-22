import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOriginAllowed } from './cors.ts';

const ALLOWED = [
	'https://play.jc.id.lv',
	'https://dicechess-play.pages.dev',
	'*.dicechess-play.pages.dev',
	'http://localhost:5174',
];

test('allows an exact origin', () => {
	assert.equal(isOriginAllowed('https://play.jc.id.lv', ALLOWED), true);
	assert.equal(isOriginAllowed('https://dicechess-play.pages.dev', ALLOWED), true);
	assert.equal(isOriginAllowed('http://localhost:5174', ALLOWED), true);
});

test('allows a strict subdomain via wildcard', () => {
	assert.equal(isOriginAllowed('https://abc123.dicechess-play.pages.dev', ALLOWED), true);
});

test('rejects a look-alike that is not a real subdomain', () => {
	assert.equal(isOriginAllowed('https://evil-dicechess-play.pages.dev', ALLOWED), false);
});

test('rejects unrelated and malformed origins', () => {
	assert.equal(isOriginAllowed('https://evil.example.com', ALLOWED), false);
	assert.equal(isOriginAllowed('http://play.jc.id.lv', ALLOWED), false); // wrong scheme, exact-only
	assert.equal(isOriginAllowed(undefined, ALLOWED), false);
	assert.equal(isOriginAllowed('not a url', ALLOWED), false);
});
