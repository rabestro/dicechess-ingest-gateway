// Analytics ingest wire format (snake_case) — the POST /api/games contract.
// Mirrors dicechess-sync / dicechess-observer src/types.ts. The gateway only relays
// this payload; the authoritative validation (engine replay → 422) happens in
// dicechess-analytics. See the wiki: "Data Acquisition / 07 Контракт ingest".

export type Color = 'w' | 'b';

export type EventType =
	| 'DOUBLE_OFFER'
	| 'DOUBLE_ACCEPT'
	| 'DOUBLE_DECLINE'
	| 'DRAW_OFFER'
	| 'DRAW_ACCEPT';

export interface PlayerInputWire {
	external_id: string;
	username?: string | null;
	player_type?: string | null;
	rating?: number | null;
}

export interface TurnInputWire {
	turn_number: number;
	active_color: Color;
	dice: number[];
	moves: string[];
}

export interface GameEventInputWire {
	sequence_number: number;
	turn_number?: number | null;
	event_type: EventType;
	actor_color?: Color | null;
	payload?: Record<string, unknown> | null;
}

export interface GameIngestWire {
	id: string;
	source: string;
	mode: string;
	result?: number | null;
	termination?: string | null;
	started_at?: string | null;
	time_initial_sec?: number | null;
	time_increment_sec?: number | null;
	initial_stake_amount?: number | null;
	final_stake_amount?: number | null;
	stake_currency?: string | null;
	white_player?: PlayerInputWire | null;
	black_player?: PlayerInputWire | null;
	initial_fen: string;
	turns: TurnInputWire[];
	events: GameEventInputWire[];
}
