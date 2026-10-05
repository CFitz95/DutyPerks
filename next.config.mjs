/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {source:"/sw.js",headers:[{key:"Cache-Control",value:"no-cache, no-store, must-revalidate"},{key:"Content-Type",value:"application/javascript; charset=utf-8"},{key:"Service-Worker-Allowed",value:"/"}]},
      {source:"/admin/:path*",headers:[{key:"Cache-Control",value:"private, no-store"}]},
      {source:"/api/:path*",headers:[{key:"Cache-Control",value:"no-store"}]},
    ];
  },
};
export default nextConfig;
