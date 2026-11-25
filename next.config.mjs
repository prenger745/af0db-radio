/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', 'three-globe', 'react-globe.gl', 'globe.gl'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    return config;
  },
};

export default nextConfig;
