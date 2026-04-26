import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/pour-les-pros",
        destination: "/pour-les-professionnels",
        permanent: true,
      },
      {
        source: "/tarifs",
        destination: "/pour-les-professionnels/tarifs",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
