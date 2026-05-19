# cache-components-cf

> **Single branch.** **`@opennextjs/aws@4.0.2`** is **Yarn-patched** by default (see **`resolutions`** in **`package.json`** and **`.yarn/patches/@opennextjs-aws-npm-4.0.2-7e625b6239.patch`**) so incremental-cache reads tolerate missing **`rsc`** / segment payloads. Remove **`resolutions`** and run **`yarn install`** for **stock** upstream and expect **`Buffer.from(undefined)`**-style adapter failures on **`yarn preview`** once R2 serves PPR/postponed entries.

Minimal **Next.js Cache Components** (`use cache`, `cacheLife`, `cacheTag`) repro deployed like **ecom-app-storefront**: **OpenNext Cloudflare** + **Wrangler** with R2 incremental cache and the same Durable Object bindings (queue, sharded tag cache, purge). The app is intentionally **English-only** (top-level routes like `/`, `/a`, `/items/1`) with hardcoded copy to keep the repro focused on cache/streaming behavior.

The patch matches **ecom-style** mitigations (optional **`rsc` / `rscData`**, `segmentContent ?? ""`) against **`dist/adapters/cache.js`** in **`@opennextjs/aws`**.

After cloning: `corepack enable` (once per machine), then `yarn install`. **`REPRO_*` vars must be defined for the Worker**, not only via npm **`cross-env`**: the isolate does **not** see your shell env. This repo sets them in **`wrangler.jsonc`** — top-level **`vars`** = stable preview (**`yarn preview:without-inc-cache`**), **`env.harsh`** = stress (**`yarn preview`**, which runs **`opennextjs-cloudflare preview --env harsh`**). **`cross-env`** on build/preview still aligns the **Node** side during **`opennextjs-cloudflare build`**. **`OPENNEXT_*`** stays in **`.dev.vars`**. Anything you add under **`REPRO_*`** in **`.dev.vars`** **overrides** `wrangler.jsonc` locally.

### Stock vs patched `@opennextjs/aws` (toggle in `package.json`)

**Patched (default in this repo):** **`package.json`** includes **`resolutions`** for **`@opennextjs/aws@npm:4.0.2`** → **`.yarn/patches/@opennextjs-aws-npm-4.0.2-7e625b6239.patch`**. Run **`yarn install`**.

**Stock (upstream adapter):** remove the entire **`resolutions`** block (and the comma before it if needed), then **`yarn install`** again.

Example of the patched **`resolutions`** entry only (merge with your real **`devDependencies`**):

```json
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260511.1",
    "@types/node": "^22.19.18",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "cross-env": "^10.1.0",
    "rimraf": "^6.1.3",
    "typescript": "5.9.3",
    "wrangler": "^4.90.0"
  },
  "resolutions": {
    "@opennextjs/aws@npm:4.0.2": "patch:@opennextjs/aws@npm%3A4.0.2#./.yarn/patches/@opennextjs-aws-npm-4.0.2-7e625b6239.patch"
  }
```

### Local preview hygiene

- **Worker vs shell:** The isolate reads **`REPRO_*`** from **`wrangler.jsonc`** (and **`.dev.vars`**, which wins locally). If **`REPRO_RESPONSE_KB`** is missing there, the app falls back to **512 KiB** — you may see **524 288** in the “Actual chars” UI, **parallel** columns (“Loading large payload…”), and **Flight** corruption (**raw Lorem**, **Connection closed**, **`Unexpected identifier`** in the console). **`cross-env` in npm `scripts` does not fix that by itself** (it mainly aligns the **Node** side during **`opennextjs-cloudflare build`**).
- **Clean trees:** `yarn preview` / `yarn preview:without-inc-cache` run **`rimraf .open-next`** at the start of each command. They **do not** delete **`.wrangler/state`**. When **switching** harsh ↔ stable, changing **`wrangler.jsonc`**, or chasing inconsistent cache/Flight behavior, prefer a full reset:
  ```bash
  rm -rf .open-next .wrangler/state
  yarn preview:without-inc-cache   # or yarn preview
  ```
- **One dev server on port 8788** (see `wrangler.jsonc` → `dev.port`). A leftover **`workerd`** causes **Address already in use**.

### Large responses (stress test)

Each route’s cached payload includes a big ASCII blob so HTML + incremental cache payloads are heavy (closer to a real CMS page). Size is controlled at **runtime** on the worker:

| Variable | Meaning |
|----------|---------|
| `REPRO_FLIGHT_SAFE_PAYLOAD` | **`1`** in **`wrangler.jsonc` / `vars`** (stable); **`0`** in **`env.harsh`**. When **`1`**, **`loadCachedPayload`** does not put the Lorem blob in Flight. |
| `REPRO_RESPONSE_KB` | Set in **`wrangler.jsonc`** for the Worker (**`8`** default / **`64`** in **`env.harsh`**). If unset in the isolate, **`loadCachedPayload` falls back to 512 KB** → parallel columns + huge Flight (classic broken stream). npm **`cross-env` alone does not fix that. |
| `REPRO_NESTED_STREAM_SERIAL_COLUMNS` | **`1`** (serial) in top-level **`wrangler.jsonc` `vars`**; **`0`** (parallel **`Suspense`**) in **`env.harsh`**. |
| `REPRO_NESTED_STREAM_PARALLEL_COLUMNS` | Number of sibling `/nested-stream` columns when serial mode is **off** (default **2**, clamped to 2..8). Higher values increase concurrent RSC payload pressure. |

Examples:

```bash
# ~2 MiB per cached page (after build)
REPRO_RESPONSE_KB=2048 yarn preview

# ~8 MiB (aggressive; may hit limits)
REPRO_RESPONSE_KB=8192 yarn cf-build && REPRO_RESPONSE_KB=8192 yarn wrangler dev
```

For deployed workers, set `REPRO_RESPONSE_KB` in the Wrangler dashboard or `wrangler.jsonc` / `.dev.vars` as a `var`.

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
| `yarn cf-build` | OpenNext worker + assets into `.open-next/` |
| `yarn preview` | **Harsh:** full OpenNext stack with **runtime incremental cache on** (R2 + DO tag cache / queue / purge) + **`opennextjs-cloudflare preview --env harsh`** → **`wrangler.jsonc` / `env.harsh`** (`REPRO_RESPONSE_KB=64`, parallel columns, full Lorem in Flight). |
| `yarn preview:without-inc-cache` | **Stable:** **`wrangler.jsonc` top-level `vars`** (`REPRO_RESPONSE_KB=8`, serial columns, **`REPRO_FLIGHT_SAFE_PAYLOAD=1`**) + dummy tag cache + prefetch off. No `--env` (not `harsh`). |
| `yarn cf-deploy` | Deploy worker (configure routes/account as needed) |
| `yarn cf-typegen` | Regenerate `cloudflare-env.d.ts` (not committed by default) |

### Patch state × preview: what to expect

Same **`wrangler.jsonc`** whether you use stock or patched `@opennextjs/aws`: **top-level `vars`** = stable REPRO (**`preview:without-inc-cache`**); **`env.harsh`** = stress REPRO (**`yarn preview`** / **`--env harsh`**).

| `@opennextjs/aws` | Command | Typical outcome |
|-------------------|---------|-----------------|
| **Stock** (no **`resolutions`**) | **`yarn preview`** | **Adapter** failures are common (`Failed to get body cache`, **`Buffer.from(undefined)`**) once the real R2 incremental cache serves PPR/postponed entries. **`/nested-stream`** / **`/items/*`** are sharp corners. If a response gets through, **harsh** REPRO + **Flight** can still break the page in the browser. |
| **Stock** | **`yarn preview:without-inc-cache`** | **Runtime** incremental cache is off (**`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`** in the script) + dummy tag/queue + **stable `vars`**, so many **adapter** read paths are avoided and the UI is usually **navigable** — but you are **not** exercising the same stack as production or **`yarn preview`**. |
| **Patched** (**`resolutions`** + **`yarn install`**) | **`yarn preview`** | **Adapter** patch applied — you most often get past **`Buffer.from`** and ordinary page-to-page navigation can look healthy. **Harsh** profile: real DO tag cache + queue, **runtime** incremental cache on, **parallel** `/nested-stream`, **full Lorem in Flight**, prefetch on → **Flight / #1115 / prefetch** issues on **`/nested-stream`** are still **expected**, including partial hangs where one column stays on **`Loading large payload…`** indefinitely. |
| **Patched** | **`yarn preview:without-inc-cache`** | **Intended stable loop:** **stable `vars`** (small target, **serial** columns, **`REPRO_FLIGHT_SAFE_PAYLOAD=1`**), **dummy** tag cache + **direct** queue + **dummy** purge, **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`** (no runtime R2 i-cache reads/writes), **`NEXT_PUBLIC_REPRO_NAV_PREFETCH=0`**. **Not** storefront-identical; it trades realism for a usable Wrangler browser session. |
| Either | **`yarn build` + `yarn start`** | **Node** server on **:3000** — **not** the Worker Flight path; use for “does Next itself behave?” vs “does Wrangler behave?”. |
| Either | **`yarn cf-build`** (+ `wrangler dev` yourself) | Matches **deploy-shaped** worker without the npm **`preview`** wrappers; tune **`--env`** / vars yourself. **Default `wrangler deploy`** uses **top-level `vars`** (stable REPRO); **`--env harsh`** for stress deploy. |

**Mitigate `/nested-stream` on Workers without switching scripts:** set **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`** in **`.dev.vars`** — it overrides the **`0`** from **`yarn preview`**. **Do not** add **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`** to **`.dev.vars`** unless you want *every* preview command to skip runtime incremental cache; use **`preview:without-inc-cache`** instead.

## What’s in the app

- **`cacheComponents: true`** in `next.config.ts`
- **`src/lib/cached.ts`**: `'use cache'` with `cacheTag('repro', routeKey, locale, …)`; locale is currently hardcoded to `en` in routes but kept in cache keys to mirror production-shaped tagging.
- **Routes** (English only): `/`, `/a`, `/b`, `/c`, `/nested-stream`, `/items/[id]`
- **`Nav`**: hardcoded English labels; **`prefetch`** follows **`NEXT_PUBLIC_REPRO_NAV_PREFETCH`**
- **`src/app/layout.tsx`**: root shell with `Nav` wrapped in **`<Suspense>`** so Cache Components + `/items/[id]` PPR can prerender

Use this to compare hangs or stuck requests: default **`yarn preview`** already leaves prefetch **on**; on **`yarn build` + `yarn start`** you can stress further with explicit env if needed. Share as a small public repro with Vercel/OpenNext/Cloudflare.

### RSC prefetch + tag cache **500** on `wrangler preview`

A full **document** request to **`/nested-stream`** can be **200** while many follow-up **`GET … ?_rsc=…`** requests (from **`Link prefetch`**) return **500**. Causes we have seen:

1. **`NEXT_TAG_CACHE_DO_SHARDED`** / queue DOs under **parallel** prefetches on local Wrangler (often paired with “Durable Object class not exported” warnings).
2. Mitigation used here: **`yarn preview:without-inc-cache`** sets **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`**, so **`open-next.config.ts`** switches to **`tagCache: 'dummy'`**, **`queue: 'direct'`**, **`cachePurge: 'dummy'`**, and **`NEXT_PUBLIC_REPRO_NAV_PREFETCH=0`**. Default `yarn preview` and `yarn cf-build` keep the full stack (like the storefront).

**Important:** The bundled worker still evaluates `process.env.OPENNEXT_PREVIEW_DISABLE_INC_CACHE` at **Worker runtime** (see `.open-next/server-functions/default/open-next.config.mjs`). Default **`.dev.vars`** does **not** set that flag so **`yarn preview`** can hit the real incremental cache; use **`preview:without-inc-cache`** or set the flag only when you need the lightweight stack. (`wrangler deploy` does not upload `.dev.vars`.) If a variable appears in **both** **`.dev.vars`** and **`cross-env`**, **`.dev.vars` wins** for preview.

## Wrangler vs storefront

`wrangler.jsonc` drops BFF, URL locator, secrets, and custom domains so the project stays self-contained. Incremental cache + DO layout matches **ecom-app-storefront** (`WORKER_SELF_REFERENCE`, `NEXT_INC_CACHE_R2_BUCKET`, `NEXT_CACHE_*` DO classes, migrations v1/v2).

### Preview 500s / `Failed to get body cache` (stock `@opennextjs/aws`)

Next **16** can emit **PPR / postponed** prerender entries where the incremental-cache JSON has **`segmentData`** (and `meta.postponed`) but **no top-level `rsc`**. Stock OpenNext **@opennextjs/aws** still does `Buffer.from(cacheData.rsc)` for `type: "app"`, which throws (`Received undefined`). That hits **`/nested-stream`**, **`/items/[id]`**, etc.—routes with nested `<Suspense>`—but it is an **adapter/cache-shape** bug, not proof that React nested boundaries are invalid.

With **stock** **`package.json`** (no patch), this is **expected** once those cache shapes are served (especially **`yarn preview`** with real R2 reads). **`yarn preview:without-inc-cache`** skips *runtime* incremental cache reads and may **mask** that adapter failure while you debug other Wrangler issues.

**With the Yarn patch enabled** (default **`resolutions`**): **`yarn install`** applies **`.yarn/patches/@opennextjs-aws-npm-4.0.2-7e625b6239.patch`** — optional **`rsc` / `rscData`**, `segmentContent ?? ""`, same mitigation pattern as **ecom-app-storefront**. Use that when you need a working incremental-cache read path and want to focus on issues like [#1115](https://github.com/opennextjs/opennextjs-cloudflare/issues/1115) or Flight corruption without **`Buffer.from(undefined)`** first.

Earlier failures from the **regional Cache API** wrapper are separate; preview scripts still set **`OPENNEXT_DISABLE_REGIONAL_CACHE=1`** for fewer moving parts locally.

### “Page couldn’t load” / `Connection closed` (default `yarn preview`)

Two separate classes of failure you may see on default `yarn preview` **after** the incremental-cache adapter successfully returns a payload (**remove `resolutions`** for stock `@opennextjs/aws` so the adapter often **throws first** — with the **default Yarn patch** you more often reach these behaviors reliably):

1. **PPR cache hit on Workers** ([opennextjs-cloudflare#1115](https://github.com/opennextjs/opennextjs-cloudflare/issues/1115)): the **first** full navigation can work, then a **refresh** or **prefetch** may serve an **incomplete** cached shell so the RSC stream ends early. Browsers report **Connection closed** or **This page couldn’t load**.  
   **`yarn preview:without-inc-cache`** sets **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`** so the worker **never reads/writes** the incremental cache at runtime (always effectively “miss” → full streaming) — useful to confirm the issue is cache-related.

2. **Huge / parallel RSC chunks on `/nested-stream`**: sibling **`Suspense`** columns each streaming a full **`REPRO_RESPONSE_KB`** blob can **corrupt or stall the Flight stream** on Workers **even when Wrangler logs 200**. With the **`@opennextjs/aws`** patch enabled, this often shifts from an immediate adapter crash to a more app-level symptom: normal navigation may work, but `/nested-stream` can render partially and leave a column such as **`Column B`** stuck on **`Loading large payload…`** indefinitely. Default **`yarn preview`** uses **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=0`**, **`REPRO_NESTED_STREAM_PARALLEL_COLUMNS=2`**, and **`REPRO_RESPONSE_KB=64`** to surface that on **`/nested-stream`**. **Mitigate:** **`yarn preview:without-inc-cache`** (forces serial mode) or set **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`** in **`.dev.vars`**, and/or lower **`REPRO_RESPONSE_KB`**. **`yarn build` + `yarn start`** hits **Node**, not the Worker streaming stack.

If problems persist after changing OpenNext or Next versions, use the reset in **Local preview hygiene** above. Large **`REPRO_RESPONSE_KB`** inflates prerendered RSC blobs; lower it to isolate size-related edge cases.
