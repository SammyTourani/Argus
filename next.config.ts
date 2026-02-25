import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "sammy-tourani",
  project: "argus",
  silent: !process.env.CI,
});
