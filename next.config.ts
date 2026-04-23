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
  serverExternalPackages: ["pdfkit", "unpdf"],
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

export default nextConfig;
