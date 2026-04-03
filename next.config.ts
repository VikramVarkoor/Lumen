import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  functions: {
    'app/api/query/route.ts': {
      maxDuration: 120,
    },
  },
}

export default nextConfig