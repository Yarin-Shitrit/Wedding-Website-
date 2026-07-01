/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // archiver (used by /api/guest-photos/zip) is a Node-only lib whose package
  // exports map trips Next's webpack bundler ("Default condition should be last
  // one"). It runs only in the nodejs runtime, so exclude it from bundling and
  // let Node require() it at runtime instead.
  experimental: {
    serverComponentsExternalPackages: ["archiver"]
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "maps.googleapis.com" }
    ]
  }
};

export default nextConfig;
