/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Note: Using /ark/ form locally; can be mapped to literal ark: at an edge proxy later
    return [
      { source: '/ark/:naan/:name*', destination: '/api/ark/:naan/:name*' },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      // Allow Notion temporary S3 URLs in admin views
      { protocol: 'https', hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com' },
    ],
  },
};

module.exports = nextConfig;
