/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;

// Dev dùng môi trường "local" trong wrangler.jsonc (D1 local, không cần đăng nhập Cloudflare)
import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev({ environment: "local" }));
