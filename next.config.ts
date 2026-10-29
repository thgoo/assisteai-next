import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Posters come from TMDb (the API sends absolute URLs)
    remotePatterns: [new URL('https://image.tmdb.org/t/p/**')],
  },
};

export default nextConfig;
