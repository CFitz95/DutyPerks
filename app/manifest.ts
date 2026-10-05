import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "DutyPerks", short_name: "DutyPerks", lang: "en",
    description: "Find verified military offers in San Diego and Whidbey Island.",
    start_url: "/", scope: "/", display: "standalone",
    background_color: "#f6f8fa", theme_color: "#153b45",
    icons: [
      { src: "/app-icon/192?v=1", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512?v=1", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512?v=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
