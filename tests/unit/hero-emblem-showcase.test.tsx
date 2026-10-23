import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HeroConsultationShowcase } from "@/components/home/hero-consultation-showcase";
import { LocaleProvider } from "@/i18n/client";
import type { PublicService } from "@/types/domain";

const sampleServices: PublicService[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "dua-and-supplication",
    name: "Dua & Supplication Guidance",
    short_description: "Focused prayer and spiritual supplications for guidance.",
    description: "Detailed guidance session for personal prayers and spiritual reflections.",
    image_url: null,
    duration_minutes: 30,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "dev-sample-standard-consultation",
    name: "Spiritual Guidance Consultation",
    short_description: "In-depth counsel on life matters and spiritual growth.",
    description: "Personal one-on-one session with Maulvi Azizurrahman.",
    image_url: null,
    duration_minutes: 45,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "family-consultation",
    name: "Family Guidance & Counsel",
    short_description: "Ethical mediation and family counsel grounded in Islamic values.",
    description: "In-depth consultation for family matters, marriage, and ethical guidance.",
    image_url: null,
    duration_minutes: 60,
  },
];

describe("HeroConsultationShowcase Component (No Logo in Hero)", () => {
  it("never renders brand logo image asset in the hero showcase", () => {
    const html = renderToStaticMarkup(<HeroConsultationShowcase services={sampleServices} />);

    // Must NOT contain the logo image or filename
    expect(html).not.toContain("azizurrahman-logo");
    expect(html).not.toContain('alt="AZIZURRAHMAN logo"');
  });

  it("renders the interactive consultation sanctum card with header and booking CTA", () => {
    const html = renderToStaticMarkup(<HeroConsultationShowcase services={sampleServices} />);

    expect(html).toContain("Select a Guidance Session");
    expect(html).toContain("Islamic Spiritual Counsel");
    expect(html).toContain("View All Slots &amp; Schedule Session");
    expect(html).toContain('href="/book"');
    expect(html).toContain("100% Confidential");
    expect(html).toContain("Qur&#x27;an &amp; Sunnah");
  });

  it("renders the 3 featured services with direct booking links", () => {
    const html = renderToStaticMarkup(<HeroConsultationShowcase services={sampleServices} />);

    expect(html).toContain("Dua &amp; Supplication Guidance");
    expect(html).toContain("Spiritual Guidance Consultation");
    expect(html).toContain("Family Guidance &amp; Counsel");

    expect(html).toContain('href="/book?service=dua-and-supplication"');
    expect(html).toContain('href="/book?service=dev-sample-standard-consultation"');
    expect(html).toContain('href="/book?service=family-consultation"');
  });

  it("renders floating live availability and ethical commitment satellite badges", () => {
    const html = renderToStaticMarkup(<HeroConsultationShowcase services={sampleServices} />);

    expect(html).toContain("Live Availability");
    expect(html).toContain("Sessions Available This Week");
    expect(html).toContain("Ethical Commitment");
    expect(html).toContain("animate-float-1");
    expect(html).toContain("animate-float-2");
  });

  it("gracefully falls back to approved default offerings when services is empty", () => {
    const html = renderToStaticMarkup(<HeroConsultationShowcase services={[]} />);

    expect(html).toContain("Dua &amp; Supplication Guidance");
    expect(html).toContain("Spiritual Guidance Consultation");
    expect(html).toContain("Family Guidance &amp; Counsel");
    expect(html).toContain('href="/book?service=dua-and-supplication"');
  });

  it("renders localized Urdu consultation card and typography when locale is Urdu", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="ur">
        <HeroConsultationShowcase services={sampleServices} />
      </LocaleProvider>,
    );

    // Urdu titles & copy
    expect(html).toContain("مشاورتی نشست کا انتخاب کریں");
    expect(html).toContain("مسنون دعائیں اور روحانی رہنمائی");
    expect(html).toContain("خاندانی و ازدواجی مشاورت");
    expect(html).toContain("قرآن و سنت");
    expect(html).toContain("مکمل رازداری");
    expect(html).toContain("font-urdu");
  });
});
