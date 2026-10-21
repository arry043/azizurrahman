import { scholarProfile } from "./scholar-profile";

/**
 * Site configuration and official client facts for AZIZURRAHMAN.
 * Reusable constants across public and administrative pages.
 */
export const isSiteIndexable = (): boolean => {
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true") return true;
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === "false") return false;
  // Default: allow indexing in production when a canonical HTTPS production domain is configured
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"))
  );
};

export const siteConfig = {
  name: "AZIZURRAHMAN",
  scholarName: scholarProfile.identity.fullNameEn,
  scholarNameUrdu: scholarProfile.identity.fullNameUr,
  scholarTitle: scholarProfile.identity.titleEn,
  scholarTitleUrdu: scholarProfile.identity.titleUr,
  description:
    "Official website of Maulvi Azizurrahman (Aamil). Ethical Islamic spiritual guidance, consultation, and prayer based on Qur'an and Sunnah.",
  locale: "en",
  logo: {
    src: "/brand/azizurrahman-logo-640.png",
    width: 640,
    height: 640,
    alt: "AZIZURRAHMAN logo",
  },
  scholarPhoto: scholarProfile.identity.avatar,
  address: scholarProfile.contact.address.full,
  compactAddress: scholarProfile.contact.address.compact,
  email: scholarProfile.contact.email,
  get indexable() {
    return isSiteIndexable();
  },
} as const;
