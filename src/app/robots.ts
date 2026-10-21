import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env/public";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl().origin;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/appointments/", "/api/"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
