/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tomato-tricky-condor-340.mypinata.cloud',
      },
    ],
  },
};

export default nextConfig;
