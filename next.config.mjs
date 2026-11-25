import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', 'three-globe', 'react-globe.gl', 'globe.gl'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      three: path.resolve('./node_modules/three'),
    };
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    return config;
  },
};

export default nextConfig;
