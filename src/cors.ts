// Origin allow-listing. An entry is either an exact origin (https://play.jc.id.lv) or a
// wildcard suffix (`*.dicechess-play.pages.dev`) matching any strict subdomain. Pure + tested.

export function isOriginAllowed(origin: string | undefined, allowed: string[]): boolean {
	if (!origin) return false;

	let host: string;
	try {
		host = new URL(origin).host;
	} catch {
		return false; // malformed Origin header
	}

	for (const entry of allowed) {
		if (entry.startsWith('*.')) {
			// `*.example.com` → match any strict subdomain: host ends with ".example.com".
			// The apex itself is not matched here (cover it with an explicit exact entry).
			const dotSuffix = entry.slice(1); // ".example.com"
			if (host.endsWith(dotSuffix)) return true;
		} else if (entry === origin) {
			return true;
		}
	}
	return false;
}
