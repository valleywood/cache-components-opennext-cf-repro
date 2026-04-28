# cache-components-cf

Minimal **Next.js Cache Components** (`use cache`, `cacheLife`, `cacheTag`) repro deployed like **ecom-app-storefront**: **OpenNext Cloudflare** + **Wrangler** with R2 incremental cache and the same Durable Object bindings (queue, sharded tag cache, purge). **next-intl** is wired the same way as the storefront (`defineRouting` with `localePrefix: 'always'`, `localeDetection: false`, `getRequestConfig` + per-request cached locale, `loadMessages` with **at → de** message fallback).

After cloning: `corepack enable` (once per machine), then `yarn install`. Local **`yarn preview`** / **`preview:timing`** rely on **`.dev.vars`** so `OPENNEXT_*`, **`REPRO_RESPONSE_KB`**, and **`REPRO_NESTED_STREAM_SERIAL_COLUMNS`** are visible **inside the Worker** (not only during the Node build).

### Large responses (stress test)

Each route’s cached payload includes a big ASCII blob so HTML + incremental cache payloads are heavy (closer to a real CMS page). Size is controlled at **runtime** on the worker:

| Variable | Meaning |
|----------|---------|
| `REPRO_RESPONSE_KB` | Approximate payload size in **kilobytes** (default **512** if unset). Hard cap **16384** (16 MiB). |
| `REPRO_NESTED_STREAM_SERIAL_COLUMNS` | When **`1`**, `/nested-stream` loads column **B** only after column **A** (including its cached blob) finishes — avoids two parallel huge RSC chunks that often break Chrome/Safari on Wrangler while the document is still **200**. Default **`0`** (parallel **`Suspense`**) for `yarn start` / stress. Preview sets **`1`**. |

Examples:

```bash
# ~2 MiB per cached page (after build)
REPRO_RESPONSE_KB=2048 yarn preview

# ~8 MiB (aggressive; may hit limits)
REPRO_RESPONSE_KB=8192 yarn cf-build && REPRO_RESPONSE_KB=8192 yarn wrangler dev
```

For deployed workers, set `REPRO_RESPONSE_KB` in the Wrangler dashboard or `wrangler.jsonc` / `.dev.vars` as a `var`.

### Server timing logs (`REPRO_TIMING`)

Set **`REPRO_TIMING=1`** (or `true`) to print **`[repro-timing]`** lines to the server console: middleware records request start, then `[locale]/layout`, `Nav`, and `/nested-stream` phases log **milliseconds since that start**. Use this to compare **`yarn build` + `yarn start:timing`** vs **`yarn preview:timing`** (same env on both). For preview/deploy, add `REPRO_TIMING=1` to `.dev.vars` or `wrangler` vars so the worker sees it.

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
| `yarn preview` | Build + preview: **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE`**, **dummy tag cache + direct queue**, **`REPRO_RESPONSE_KB=64`**, **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`** (Workers-safe `/nested-stream`), **`NEXT_PUBLIC_REPRO_NAV_PREFETCH=0`**. |
| `yarn preview:timing` | Like `yarn preview` with `REPRO_TIMING=1`. |
| `yarn preview:with-inc-cache` | Preview **with** runtime incremental cache (storefront-like). May show “Page couldn’t load” / connection closed on refresh until OpenNext [#1115](https://github.com/opennextjs/opennextjs-cloudflare/issues/1115) is fully fixed. |
| `yarn cf-deploy` | Deploy worker (configure routes/account as needed) |
| `yarn cf-typegen` | Regenerate `cloudflare-env.d.ts` (not committed by default) |

## What’s in the app

- **`cacheComponents: true`** in `next.config.ts`
- **`next-intl`**: `createNextIntlPlugin` → `src/lib/i18n/request.ts`, `src/middleware.ts` (`createMiddleware`), `createNavigation` for **`Link`**, messages under `messages/*.json`
- **`src/lib/cached.ts`**: `'use cache'` with `cacheTag('repro', routeKey, locale, …)` so cache keys include **locale** (like real layout data)
- **Routes** (always prefixed): `/en`, `/en/a`, `/en/items/1`, … (locales: `en`, `no`, `se`, `dk`, `fi`, `de`, `at`)
- **`LocaleSwitcher`**: client `useLocale` + `usePathname` + `Link` with `locale={…}`; **`prefetch`** follows **`NEXT_PUBLIC_REPRO_NAV_PREFETCH`** (default on; preview sets **`0`**)
- **`Nav`**: async `getTranslations` + locale-aware `Link`; **`prefetch`** follows **`NEXT_PUBLIC_REPRO_NAV_PREFETCH`**
- **`[locale]/layout.tsx`**: `LocaleSwitcher` and `Nav` wrapped in **`<Suspense>`** so Cache Components + `/items/[id]` PPR can prerender (mirrors constraints you hit with next-intl in the shell)

Use this to compare hangs or stuck requests (set **`NEXT_PUBLIC_REPRO_NAV_PREFETCH=1`** for stress testing parallel prefetches on **`yarn build` + `yarn start`**), and to share a small public repro with Vercel/OpenNext/Cloudflare.

### RSC prefetch + tag cache **500** on `wrangler preview`

A full **document** request to **`/en/nested-stream`** can be **200** while many follow-up **`GET … ?_rsc=…`** requests (from **`Link prefetch`**) return **500**. Causes we have seen:

1. **`NEXT_TAG_CACHE_DO_SHARDED`** / queue DOs under **parallel** prefetches on local Wrangler (often paired with “Durable Object class not exported” warnings).
2. Mitigation used here: when **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`**, **`open-next.config.ts`** switches to **`tagCache: 'dummy'`**, **`queue: 'direct'`**, **`cachePurge: 'dummy'`**, and preview scripts set **`NEXT_PUBLIC_REPRO_NAV_PREFETCH=0`**. Production-shaped preview remains **`yarn preview:with-inc-cache`** / **`yarn cf-build`**.

**Important:** The bundled worker still evaluates `process.env.OPENNEXT_PREVIEW_DISABLE_INC_CACHE` at **Worker runtime** (see `.open-next/server-functions/default/open-next.config.mjs`). Shell `cross-env` on `yarn preview` only applies to the Node/OpenNext **build** process — **not** to the isolate. If Wrangler logs show **`[shardedTagCache]`** while using `yarn preview`, the runtime env is missing. This repo ships **`.dev.vars`** so local preview gets **`OPENNEXT_*`**, **`REPRO_RESPONSE_KB`**, and **`REPRO_NESTED_STREAM_SERIAL_COLUMNS`** inside the worker. (`wrangler deploy` does not upload `.dev.vars`; set production vars in the dashboard or `wrangler.jsonc` if needed.) For **`yarn preview:timing`**, add **`REPRO_TIMING=1`** to `.dev.vars` (commented example in that file).

## Wrangler vs storefront

`wrangler.jsonc` drops BFF, URL locator, secrets, and custom domains so the project stays self-contained. Incremental cache + DO layout matches **ecom-app-storefront** (`WORKER_SELF_REFERENCE`, `NEXT_INC_CACHE_R2_BUCKET`, `NEXT_CACHE_*` DO classes, migrations v1/v2).

### Preview 500s / `Failed to get body cache`

Next **16** can emit **PPR / postponed** prerender entries where the incremental-cache JSON has **`segmentData`** (and `meta.postponed`) but **no top-level `rsc`**. Stock OpenNext **@opennextjs/aws** still does `Buffer.from(cacheData.rsc)` for `type: "app"`, which throws (`Received undefined`). That hits **`/nested-stream`**, **`/items/[id]`**, etc.—routes with nested `<Suspense>`—but it is an **adapter/cache-shape** bug, not proof that React nested boundaries are invalid. Same pattern as **ecom-app-storefront**: this repo applies a **Yarn patch** on **`@opennextjs/aws`** (see `.yarn/patches/` and `package.json` `resolutions`) so **`rsc` / `rscData` are optional** and segment chunks use `segmentContent ?? ""`.

Earlier failures from the **regional Cache API** wrapper are separate; **`yarn preview`** still sets **`OPENNEXT_DISABLE_REGIONAL_CACHE=1`** for fewer moving parts locally.

### “Page couldn’t load” / `Connection closed` on `yarn preview`

Two separate classes of failure:

1. **PPR cache hit on Workers** ([opennextjs-cloudflare#1115](https://github.com/opennextjs/opennextjs-cloudflare/issues/1115)): the **first** full navigation can work, then a **refresh** or **prefetch** may serve an **incomplete** cached shell so the RSC stream ends early. Browsers report **Connection closed** or **This page couldn’t load**.  
   **`yarn preview` / `preview:timing`** set **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`** at **build** time so the worker **never reads/writes the incremental cache at runtime** (always effectively “miss” → full streaming). **`yarn cf-build`** omits that flag so deploys still use R2 like the storefront.

2. **Huge / parallel RSC chunks on `/nested-stream`**: two **`Suspense`** columns each streaming a full **`REPRO_RESPONSE_KB`** blob can **corrupt the Flight stream** on Workers (browser: **This page couldn’t load** or stray `Lorem ipsum` in the shell) **even when Wrangler logs 200**. Mitigations used on **`yarn preview`**: **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`** (sequential columns) and a lower **`REPRO_RESPONSE_KB`** (**64** in scripts + `.dev.vars`). For parallel stress again, use **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=0`** with **`yarn build` + `yarn start`** or tune KB carefully.

If you still see odd cache behavior after changing OpenNext or Next versions, remove **`./.wrangler/state`** and rebuild. Large **`REPRO_RESPONSE_KB`** inflates prerendered RSC blobs; lower it to isolate size-related edge cases.
