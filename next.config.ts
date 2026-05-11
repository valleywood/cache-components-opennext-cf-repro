import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const bypassIntl = process.env.REPRO_BYPASS_NEXT_INTL === '1';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/lib/i18n/request.ts',
});

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default bypassIntl ? nextConfig : withNextIntl(nextConfig);

initOpenNextCloudflareForDev();
