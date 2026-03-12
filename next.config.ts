import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

function toOrigin(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function createCspValue(): string {
  const extraConnectOrigins = new Set<string>();
  const modelOrigin = toOrigin(process.env.NEXT_PUBLIC_FACE_LANDMARKER_MODEL_URL);
  const appOrigin = toOrigin(process.env.NEXT_PUBLIC_APP_URL);

  if (modelOrigin) {
    extraConnectOrigins.add(modelOrigin);
  }
  if (appOrigin) {
    extraConnectOrigins.add(appOrigin);
  }
  extraConnectOrigins.add('https://cdn.jsdelivr.net');
  extraConnectOrigins.add('https://storage.googleapis.com');

  const connectSrc = ["'self'", ...extraConnectOrigins, 'blob:', 'data:'].join(' ');

  return [
    "default-src 'self'",
    `connect-src ${connectSrc}`,
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests'
  ].join('; ');
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const cspValue = createCspValue();

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspValue },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=()'
          }
        ]
      }
    ];
  },
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url))
  }
};

export default nextConfig;
