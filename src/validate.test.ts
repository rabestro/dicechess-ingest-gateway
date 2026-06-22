import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateIngest } from './validate.ts';

const valid = {
	id: '018f-uuid',
	source: 'playsite',
	mode: 'classic',
	initial_fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
	turns: [{ turn_number: 1, active_color: 'w', dice: [1, 2, 3], moves: ['e2e4'] }],
	events: [],
};

test('accepts a well-formed playsite game', () => {
	assert.deepEqual(validateIngest(valid, 'playsite'), { ok: true });
});

test('rejects a non-object body', () => {
	assert.equal(validateIngest(null, 'playsite').ok, false);
	assert.equal(validateIngest([valid], 'playsite').ok, false);
	assert.equal(validateIngest('x', 'playsite').ok, false);
});

test('rejects missing id', () => {
	assert.equal(validateIngest({ ...valid, id: '' }, 'playsite').ok, false);
});

test('rejects a foreign source', () => {
	assert.equal(validateIngest({ ...valid, source: 'dicechess.com' }, 'playsite').ok, false);
});

test('rejects missing initial_fen and non-array turns', () => {
	assert.equal(validateIngest({ ...valid, initial_fen: '' }, 'playsite').ok, false);
	assert.equal(validateIngest({ ...valid, turns: 'nope' }, 'playsite').ok, false);
});

test('rejects non-array events when present', () => {
	assert.equal(validateIngest({ ...valid, events: {} }, 'playsite').ok, false);
});
