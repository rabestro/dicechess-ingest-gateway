# dicechess-ingest-gateway

A tiny token-holding relay between the public play site ([dicechess-play](https://github.com/rabestro/dicechess-play)) and **dicechess-analytics**.

The browser `POST`s a finished game here with **no auth**; the gateway holds the analytics
`INGEST_TOKEN`, applies CORS + rate limiting + a structural check, and forwards the game to
`sync.jc.id.lv` with the `Bearer` token. **The token never reaches the browser** — that is the
whole point (ADR-0005 in the `dicechess-docs` Play Site section).

```
browser (play.jc.id.lv) ──POST /api/games (no token)──▶ gateway ──POST /api/games (Bearer)──▶ sync.jc.id.lv
```

## Stack

Node 26 (native TypeScript, no build step), plain `node:http`, **zero runtime dependencies**.
Authoritative game validation is NOT done here — dicechess-analytics replays every game with the
engine and returns `422` for illegal ones; the gateway passes that status straight back to the
browser, whose IndexedDB outbox quarantines rejects and retries transient errors.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health`, `/` | health check (Koyeb) |
| `POST` | `/api/games` | accept a `GameIngestWire` game, forward to analytics |
| `OPTIONS` | `/api/games` | CORS preflight |

Status mapping returned to the browser: `201` created · `200` already existed · `422` rejected
(local validation or analytics replay) · `429` rate limited · `413` too large · `502` upstream/auth error.

## Configuration (env)

| Var | Required | Default |
|---|---|---|
| `INGEST_TOKEN` | ✅ | — (refuses to start without it) |
| `ANALYTICS_BASE_URL` | | `https://sync.jc.id.lv` |
| `ALLOWED_ORIGINS` | | play.jc.id.lv + dicechess-play.pages.dev (+ `*.` previews) + localhost |
| `EXPECTED_SOURCE` | | `playsite` |
| `PORT` | | `8080` |
| `MAX_BODY_BYTES` / `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | | `262144` / `60` / `60000` |

See `.env.example`.

## Local development

```bash
npm install                      # installs devDeps only (typescript, @types/node)
cp .env.example .env             # set INGEST_TOKEN (a staging token is safest)
npm run dev                      # node --env-file=.env --watch src/server.ts
npm run typecheck                # tsc --noEmit
npm test                         # node --test
```

## Deploy on Koyeb

1. Koyeb dashboard → **Create Web Service** → **GitHub** → select `rabestro/dicechess-ingest-gateway`.
2. Builder: **Dockerfile** (auto-detected). Instance: the free `nano` is enough.
3. **Environment variables** → add `INGEST_TOKEN` as a **secret**; set `ANALYTICS_BASE_URL`
   (`https://sync.jc.id.lv`) and `ALLOWED_ORIGINS` if different from the defaults.
4. **Port**: `8080`. **Health check**: HTTP `GET /health`.
5. Deploy → note the public URL (e.g. `https://<app>.koyeb.app`).
6. In `dicechess-play`, set the repo Variable `VITE_INGEST_GATEWAY_URL` to that URL and redeploy.

Once live, finished games on the play site flow through the gateway into analytics with
`source='playsite'`.
