import { stripeConfig } from "./lib/stripe/config";
import type { NextConfig } from "next";
import { getSupabaseConfig } from "./lib/supabase/config";
// Fail before bundling if a privileged key was assigned to a public variable.
getSupabaseConfig();
stripeConfig();
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Content-Security-Policy-Report-Only",
            value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://*.analytics.google.com https://www.facebook.com; frame-src https://js.stripe.com https://hooks.stripe.com; form-action 'self' https://checkout.stripe.com; report-to csp-endpoint",
          },
          {
            key: "Report-To",
            value: '{"group":"csp-endpoint","max_age":10886400,"endpoints":[{"url":"/api/health"}]}',
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
