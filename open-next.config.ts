import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import type { OpenNextConfig } from '@opennextjs/cloudflare';
import { purgeCache } from '@opennextjs/cloudflare/overrides/cache-purge/index';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

/**
 * `OPENNEXT_DISABLE_REGIONAL_CACHE=1` → R2 only (no Workers Cache API wrapper).
 * Omit it for storefront-style **`withRegionalCache`** (typical production).
 *
 * Wrangler `preview` can hit `Failed to get body cache` / `Buffer.from(undefined)` when the
 * regional layer returns a stale entry whose JSON is missing `rsc` (OpenNext uses
 * `Buffer.from(cacheData.rsc)` with no fallback). Preview scripts set the env var to avoid that.
 * If 500s persist, clear **`./.wrangler/state`** and rebuild.
 */
const useRegionalIncrementalCache =
  process.env.OPENNEXT_DISABLE_REGIONAL_CACHE !== '1';

const incrementalCache = useRegionalIncrementalCache
  ? withRegionalCache(r2IncrementalCache, {
      mode: 'long-lived',
      bypassTagCacheOnCacheHit: false,
    })
  : r2IncrementalCache;

/**
 * **`yarn preview:without-inc-cache`** sets **`OPENNEXT_PREVIEW_DISABLE_INC_CACHE=1`**. That enables a
 * **lightweight cache stack**: dummy tag cache, direct queue, dummy CDN purge — so `wrangler`
 * preview does not rely on Durable Object tag-cache replication under a burst of parallel
 * **`Link prefetch`** RSC requests (which otherwise often returns **500** locally).
 */
const previewLightweight =
  process.env.OPENNEXT_PREVIEW_DISABLE_INC_CACHE === '1';

/** Mirrors ecom-app-storefront OpenNext cache bindings (R2 + DO queue + sharded tag cache). */
const cloudflareConfig = defineCloudflareConfig({
  incrementalCache,
  queue: previewLightweight ? 'direct' : doQueue,
  tagCache: previewLightweight ? 'dummy' : doShardedTagCache({
    baseShardSize: 12,
    regionalCache: true,
    regionalCacheTtlSec: 5,
    shardReplication: {
      numberOfSoftReplicas: 4,
      numberOfHardReplicas: 2,
      regionalReplication: {
        defaultRegion: 'weur',
      },
    },
  }),
  enableCacheInterception: false,
  cachePurge: previewLightweight ? 'dummy' : purgeCache({ type: 'durableObject' }),
});

/**
 * **`yarn preview:without-inc-cache`**: disable **runtime** incremental cache reads/writes so
 * Workers always miss the prerendered PPR shell in R2 (avoids [#1115](https://github.com/opennextjs/opennextjs-cloudflare/issues/1115) locally).
 * Default **`yarn preview`** leaves the flag **off** so the repro matches storefront / `yarn cf-build`.
 */
const openNextConfig: OpenNextConfig = {
  ...cloudflareConfig,
  dangerous: {
    ...cloudflareConfig.dangerous,
    disableIncrementalCache:
      process.env.OPENNEXT_PREVIEW_DISABLE_INC_CACHE === '1',
  },
};

export default openNextConfig;
