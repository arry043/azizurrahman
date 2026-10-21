import type { Metadata } from "next";

import { PrivacyView } from "./privacy-view";

export const metadata: Metadata = {
  title: "Privacy Notice & Data Protection",
  description:
    "Privacy and data protection policy for the AZIZURRAHMAN appointment booking platform. Ethical data minimisation, secure records, and guest rights.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Notice & Data Protection · AZIZURRAHMAN",
    description:
      "Privacy and data protection policy for the AZIZURRAHMAN appointment booking platform. Ethical data minimisation, secure records, and guest rights.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return <PrivacyView />;
}
