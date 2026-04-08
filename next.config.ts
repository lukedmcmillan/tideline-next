import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure PDFKit's AFM font metric files are bundled with the serverless
  // function on Vercel. Without this, PDFKit throws ENOENT for Helvetica.afm.
  outputFileTracingIncludes: {
    "/api/lp-briefing/pdf": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
