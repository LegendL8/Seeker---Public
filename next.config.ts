import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.auth0.com",
  "style-src 'self' 'unsafe-inline' https://*.auth0.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://*.auth0.com",
  "connect-src 'self' https://*.auth0.com",
  "frame-src 'self' https://*.auth0.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const cspFrameSelf = "frame-ancestors 'self'";

const permissionsPolicy = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
].join(", ");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source:
          "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico|json)$).*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Permissions-Policy", value: permissionsPolicy },
        ],
      },
      {
        source: "/api/proxy/v1/resumes/:id/preview",
        headers: [{ key: "Content-Security-Policy", value: cspFrameSelf }],
      },
    ];
  },
};

export default nextConfig;
