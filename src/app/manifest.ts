import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "eAcharya",
    short_name: "eAcharya",
    description: "Geography and Economics learning for Classes 9–12.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9f4",
    theme_color: "#0b6b4a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
