import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // PDFKit reads Helvetica.afm at runtime via `fs.readFileSync(__dirname + '/data/...')`.
  // When webpack bundles it, __dirname no longer points at the real package and
  // the AFM files are missing, giving ENOENT on Vercel. Marking pdfkit as an
  // external server package keeps it in node_modules, and Vercel's node tracer
  // follows the require and bundles the js/data directory automatically.
  serverExternalPackages: ["pdfkit", "unpdf", "@react-email/components", "@react-email/render"],
  // Belt and braces: explicitly include the AFM data directory in the function trace.
  outputFileTracingIncludes: {
    "/api/lp-briefing/pdf": ["./node_modules/pdfkit/js/data/**/*"],
    "app/api/lp-briefing/pdf/route": ["./node_modules/pdfkit/js/data/**/*"],
  },
  async redirects() {
    const trackerRedirects = [
      'isa','bbnj','iuu','30x30','blue-finance',
      'plastics','imo-shipping','wto-fisheries',
      'offshore-wind','cites-marine','governance',
    ].map(slug => ({
      source: `/tracker/${slug}`,
      destination: `/platform/tracker/${slug}`,
      permanent: true,
    }));

    return [
      ...trackerRedirects,
      // Entities pages consolidated into Directory
      {
        source: '/platform/entities',
        destination: '/platform/directory?scope=tracked',
        permanent: false,
      },
      {
        source: '/platform/entities/:path*',
        destination: '/platform/directory?scope=tracked',
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "tideline",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
