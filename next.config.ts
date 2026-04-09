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
  serverExternalPackages: ["pdfkit"],
  // Belt and braces: explicitly include the AFM data directory in the function trace.
  outputFileTracingIncludes: {
    "/api/lp-briefing/pdf": ["./node_modules/pdfkit/js/data/**/*"],
    "app/api/lp-briefing/pdf/route": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
