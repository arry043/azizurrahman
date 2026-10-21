import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Nastaliq_Urdu } from "next/font/google";

import { siteConfig } from "@/config/site";
import { LocaleProvider } from "@/i18n/client";
import { getDirection } from "@/i18n/config";
import { getServerLocale, getServerTranslations } from "@/i18n/server";
import { getSiteUrl } from "@/lib/env/public";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const notoNastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  robots: siteConfig.indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      { url: siteConfig.logo.src, width: siteConfig.logo.width, height: siteConfig.logo.height },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#032f25",
  colorScheme: "light",
};

export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();
  const dir = getDirection(locale);
  const { t } = await getServerTranslations(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${cormorant.variable} ${notoNastaliq.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t.common.skipToMainContent}
        </a>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
