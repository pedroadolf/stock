import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  typescript: {
    // !! ADVERTENCIA !!
    // Permite que los builds de producción se completen con éxito
    // incluso si tu proyecto tiene errores temporales de TypeScript.
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/siniestros/:path*',
        destination: '/portafolios/:path*',
        permanent: true,
      },
      {
        source: '/tramites/:path*',
        destination: '/operaciones/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
