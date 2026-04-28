# cache-components-cf

Minimal **Next.js Cache Components** (`use cache`, `cacheLife`, `cacheTag`) repro deployed like **ecom-app-storefront**: **OpenNext Cloudflare** + **Wrangler** with R2 incremental cache and the same Durable Object bindings (queue, sharded tag cache, purge). **next-intl** is wired the same way as the storefront (`defineRouting` with `localePrefix: 'always'`, `localeDetection: false`, `getRequestConfig` + per-request cached locale, `loadMessages` with **at → de** message fallback).

After cloning: `corepack enable` (once per machine), then `yarn install`. Default **`yarn preview`** is **production-shaped** (real R2 incremental cache, DO tag cache, **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=0`**, Link **prefetch** on) so you can reproduce Wrangler issues quickly. Use **`yarn preview:without-inc-cache`** when you need a **stable** local loop. **`.dev.vars`** supplies **`OPENNEXT_DISABLE_REGIONAL_CACHE`**, **`REPRO_RESPONSE_KB`**, etc.; any key set there **overrides** the same key from **`cross-env`** in a script (OpenNext merges Wrangler env on top of `process.env`).

### Large responses (stress test)

Each route’s cached payload includes a big ASCII blob so HTML + incremental cache payloads are heavy (closer to a real CMS page). Size is controlled at **runtime** on the worker:

| Variable | Meaning |
|----------|---------|
| `REPRO_RESPONSE_KB` | Approximate payload size in **kilobytes** (default **512** if unset). Hard cap **16384** (16 MiB). |
| `REPRO_NESTED_STREAM_SERIAL_COLUMNS` | When **`1`**, `/nested-stream` serializes columns — avoids two parallel huge RSC chunks that often break Chrome/Safari on Wrangler (**200** HTML, broken Flight). Default **`0`** (parallel **`Suspense`**) on **`yarn preview`** / **`yarn start`** to **show** that risk; **`yarn preview:without-inc-cache`** forces **`1`**. |

Examples:

```bash
# ~2 MiB per cached page (after build)
REPRO_RESPONSE_KB=2048 yarn preview

# ~8 MiB (aggressive; may hit limits)
REPRO_RESPONSE_KB=8192 yarn cf-build && REPRO_RESPONSE_KB=8192 yarn wrangler dev
```

For deployed workers, set `REPRO_RESPONSE_KB` in the Wrangler dashboard or `wrangler.jsonc` / `.dev.vars` as a `var`.

### Server timing logs (`REPRO_TIMING`)

Set **`REPRO_TIMING=1`** (or `true`) to print **`[repro-timing]`** lines to the server console: middleware records request start, then `[locale]/layout`, `Nav`, and `/nested-stream` phases log **milliseconds since that start**. Use this to compare **`yarn build` + `yarn start:timing`** vs **`yarn preview:timing`** / **`yarn preview:without-inc-cache:timing`**. The timing variants set **`REPRO_TIMING`** via the shell; you can also uncomment it in **`.dev.vars`** (then it overrides the script for keys that appear in both).

## Prereqs

- Node 20+ with [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`) so Yarn 4.10 is used via `packageManager` in `package.json`
- Cloudflare account (`yarn wrangler login`)
- R2 bucket (once): `yarn wrangler r2 bucket create cache-components-cf-inc-cache`

## Scripts

| Command | Purpose |
|--------|---------|
| `yarn dev` | Next.js dev (includes `initOpenNextCloudflareForDev`) |
| `yarn build` | `next build` only |
| `yarn start` | Production server on **http://localhost:3000** (after `yarn build`) |
| `yarn start:timing` | Same as `yarn start` but `REPRO_TIMING=1` (phase logs in terminal) |
| `yarn cf-build` | OpenNext worker + assets into `.open-next/` |
| `yarn preview` | **Showcase / harsh:** real **R2 incremental cache** + **DO tag cache**, **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=0`** (parallel `/nested-stream`), **`REPRO_RESPONSE_KB=64`**, **`OPENNEXT_DISABLE_REGIONAL_CACHE=1`**, default Link **prefetch** (**on**). Expect [#1115](https://github.com/opennextjs/opennextjs-cloudflare/issues/1115) on refresh, prefetch **500**s, and/or Flight glitches on `/nested-stream` depending on browser and timing. |
| `yarn preview:timing` | Like `yarn preview` with `REPRO_TIMING=1`. |
| `yarn preview:without-inc-cache` | **Stable local preview:** **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`**, **dummy tag cache + direct queue**, **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`**, **`NEXT_PUBLIC_REPRO_NAV_PREFETCH=0`**, **`REPRO_RESPONSE_KB=64`**. |
| `yarn preview:without-inc-cache:timing` | Like `yarn preview:without-inc-cache` with `REPRO_TIMING=1`. |
| `yarn preview:with-inc-cache` | Alias for **`yarn preview`** (older name). |
| `yarn cf-deploy` | Deploy worker (configure routes/account as needed) |
| `yarn cf-typegen` | Regenerate `cloudflare-env.d.ts` (not committed by default) |

**Mitigate `/nested-stream` on Workers without switching scripts:** set **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`** in **`.dev.vars`** — it overrides the **`0`** from **`yarn preview`**. **Do not** add **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`** to **`.dev.vars`** unless you want *every* preview command to skip runtime incremental cache; use **`preview:without-inc-cache`** instead.

## What’s in the app

- **`cacheComponents: true`** in `next.config.ts`
- **`next-intl`**: `createNextIntlPlugin` → `src/lib/i18n/request.ts`, `src/middleware.ts` (`createMiddleware`), `createNavigation` for **`Link`**, messages under `messages/*.json`
- **`src/lib/cached.ts`**: `'use cache'` with `cacheTag('repro', routeKey, locale, …)` so cache keys include **locale** (like real layout data)
- **Routes** (always prefixed): `/en`, `/en/a`, `/en/items/1`, … (locales: `en`, `no`, `se`, `dk`, `fi`, `de`, `at`)
- **`LocaleSwitcher`**: client `useLocale` + `usePathname` + `Link` with `locale={…}`; **`prefetch`** follows **`NEXT_PUBLIC_REPRO_NAV_PREFETCH`** (default **on**; **`preview:without-inc-cache`** sets **`0`**)
- **`Nav`**: async `getTranslations` + locale-aware `Link`; **`prefetch`** follows **`NEXT_PUBLIC_REPRO_NAV_PREFETCH`**
- **`[locale]/layout.tsx`**: `LocaleSwitcher` and `Nav` wrapped in **`<Suspense>`** so Cache Components + `/items/[id]` PPR can prerender (mirrors constraints you hit with next-intl in the shell)

Use this to compare hangs or stuck requests: default **`yarn preview`** already leaves prefetch **on**; on **`yarn build` + `yarn start`** you can stress further with explicit env if needed. Share as a small public repro with Vercel/OpenNext/Cloudflare.

### RSC prefetch + tag cache **500** on `wrangler preview`

A full **document** request to **`/en/nested-stream`** can be **200** while many follow-up **`GET … ?_rsc=…`** requests (from **`Link prefetch`**) return **500**. Causes we have seen:

1. **`NEXT_TAG_CACHE_DO_SHARDED`** / queue DOs under **parallel** prefetches on local Wrangler (often paired with “Durable Object class not exported” warnings).
2. Mitigation used here: **`yarn preview:without-inc-cache`** sets **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`**, so **`open-next.config.ts`** switches to **`tagCache: 'dummy'`**, **`queue: 'direct'`**, **`cachePurge: 'dummy'`**, and **`NEXT_PUBLIC_REPRO_NAV_PREFETCH=0`**. Default `yarn preview` and `yarn cf-build` keep the full stack (like the storefront).

**Important:** The bundled worker still evaluates `process.env.OPENNEXT_PREVIEW_DISABLE_INC_CACHE` at **Worker runtime** (see `.open-next/server-functions/default/open-next.config.mjs`). Default **`.dev.vars`** does **not** set that flag so **`yarn preview`** can hit the real incremental cache; use **`preview:without-inc-cache`** or set the flag only when you need the lightweight stack. (`wrangler deploy` does not upload `.dev.vars`.) If a variable appears in **both** **`.dev.vars`** and **`cross-env`**, **`.dev.vars` wins** for preview.

## Wrangler vs storefront

`wrangler.jsonc` drops BFF, URL locator, secrets, and custom domains so the project stays self-contained. Incremental cache + DO layout matches **ecom-app-storefront** (`WORKER_SELF_REFERENCE`, `NEXT_INC_CACHE_R2_BUCKET`, `NEXT_CACHE_*` DO classes, migrations v1/v2).

### Preview 500s / `Failed to get body cache`

Next **16** can emit **PPR / postponed** prerender entries where the incremental-cache JSON has **`segmentData`** (and `meta.postponed`) but **no top-level `rsc`**. Stock OpenNext **@opennextjs/aws** still does `Buffer.from(cacheData.rsc)` for `type: "app"`, which throws (`Received undefined`). That hits **`/nested-stream`**, **`/items/[id]`**, etc.—routes with nested `<Suspense>`—but it is an **adapter/cache-shape** bug, not proof that React nested boundaries are invalid. Same pattern as **ecom-app-storefront**: this repo applies a **Yarn patch** on **`@opennextjs/aws`** (see `.yarn/patches/` and `package.json` `resolutions`) so **`rsc` / `rscData` are optional** and segment chunks use `segmentContent ?? ""`.

Earlier failures from the **regional Cache API** wrapper are separate; preview scripts still set **`OPENNEXT_DISABLE_REGIONAL_CACHE=1`** for fewer moving parts locally.

### “Page couldn’t load” / `Connection closed` (default `yarn preview`)

Two separate classes of failure you are meant to see on default `yarn preview`:

1. **PPR cache hit on Workers** ([opennextjs-cloudflare#1115](https://github.com/opennextjs/opennextjs-cloudflare/issues/1115)): the **first** full navigation can work, then a **refresh** or **prefetch** may serve an **incomplete** cached shell so the RSC stream ends early. Browsers report **Connection closed** or **This page couldn’t load**.  
   **`yarn preview:without-inc-cache`** sets **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`** so the worker **never reads/writes** the incremental cache at runtime (always effectively “miss” → full streaming) — useful to confirm the issue is cache-related.

2. **Huge / parallel RSC chunks on `/nested-stream`**: two **`Suspense`** columns each streaming a full **`REPRO_RESPONSE_KB`** blob can **corrupt the Flight stream** on Workers (browser: **This page couldn’t load** or stray `Lorem ipsum` in the shell) **even when Wrangler logs 200**. Default **`yarn preview`** uses **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=0`** and **`REPRO_RESPONSE_KB=64`** to surface that on **`/en/nested-stream`**. **Mitigate:** **`yarn preview:without-inc-cache`** (forces **`1`**) or set **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`** in **`.dev.vars`**, and/or lower **`REPRO_RESPONSE_KB`**. **`yarn build` + `yarn start`** hits **Node**, not the Worker streaming stack.

If you still see odd cache behavior after changing OpenNext or Next versions, remove **`./.wrangler/state`** and rebuild. Large **`REPRO_RESPONSE_KB`** inflates prerendered RSC blobs; lower it to isolate size-related edge cases.
