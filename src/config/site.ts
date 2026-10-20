import { scholarProfile } from "./scholar-profile";

/**
 * Site configuration and official client facts for AZIZURRAHMAN.
 * Reusable constants across public and administrative pages.
 */
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
  indexable: false,
} as const;
