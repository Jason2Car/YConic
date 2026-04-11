/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // App Router is stable in Next.js 14
    },
    webpack: (config) => {
        // Monaco editor needs this
        config.resolve.fallback = { fs: false, path: false };
        return config;
    },
};

module.exports = nextConfig;
