import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/lib/i18n/request.ts',
});

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default withNextIntl(nextConfig);

initOpenNextCloudflareForDev();
