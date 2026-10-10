import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Catch Me Up",
    short_name: "Catch Me Up",
    description:
      "A second-screen companion for cricket fans — verified, spoiler-safe recaps in your language.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0a16",
    theme_color: "#1a1733",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
