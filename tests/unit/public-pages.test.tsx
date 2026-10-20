import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import AboutPage from "@/app/(public)/about/page";
import AppointmentLookupPage from "@/app/(public)/appointments/lookup/page";
import BookAppointmentPage, { SelectedServiceCallout } from "@/app/(public)/book/page";
import ContactPage from "@/app/(public)/contact/page";
import PublicError from "@/app/(public)/error";
import PublicLoading from "@/app/(public)/loading";
import HomePage from "@/app/(public)/page";
import ServicesPage from "@/app/(public)/services/page";
import ServiceDetailPage from "@/app/(public)/services/[slug]/page";
import NotFound from "@/app/not-found";
import { PRIMARY_NAV_ITEMS, PUBLIC_NAV_ITEMS } from "@/config/navigation";
import * as publicServices from "@/lib/services/public-services";
import type { PublicSiteSettings } from "@/lib/services/public-services";
import type { PublicService } from "@/types/domain";

const mockServices: PublicService[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    slug: "dua-and-supplication",
    name: "Dua & Supplication Guidance",
    short_description: "Focused prayer and spiritual supplications for guidance.",
    description: "Detailed guidance session for personal prayers and spiritual reflections.",
    image_url: null,
    duration_minutes: 30,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    slug: "family-consultation",
    name: "Family Guidance & Counsel",
    short_description: "Ethical mediation and family counsel grounded in Islamic values.",
    description: "In-depth consultation for family matters, marriage, and ethical guidance.",
    image_url: null,
    duration_minutes: 60,
  },
];

const mockSiteSettings: PublicSiteSettings = {
  public_phone: "+919876543210",
  public_whatsapp: "+919876543210",
  public_email: "guidance@example.com",
  public_address: "Private Consultation Rooms, Hyderabad",
  consultation_hours_text: "Monday to Saturday, 10:00 AM – 7:00 PM",
  whatsapp_message_template: "Assalamu Alaikum, I would like to book a consultation.",
  booking_horizon_days: 60,
  min_advance_notice_minutes: 1440,
};

describe("Public Website Pages", () => {
  describe("Navigation & Route Security", () => {
    it("public navigation never links to admin or private paths", () => {
      const allHrefs = [...PUBLIC_NAV_ITEMS, ...PRIMARY_NAV_ITEMS].map((item) => item.href);
      for (const href of allHrefs) {
        expect(href).not.toContain("admin");
        expect(href).not.toContain("dashboard");
        expect(href).not.toContain("api/");
      }
    });

    it("public navigation contains all approved public routes", () => {
      const hrefs = PUBLIC_NAV_ITEMS.map((item) => item.href);
      expect(hrefs).toContain("/");
      expect(hrefs).toContain("/about");
      expect(hrefs).toContain("/services");
      expect(hrefs).toContain("/book");
      expect(hrefs).toContain("/contact");
      expect(hrefs).toContain("/appointments/lookup");
    });
  });

  describe("Home Page", () => {
    it("renders hero, trust principles, and featured services", async () => {
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce(mockServices);
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(mockSiteSettings);

      const page = await HomePage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("AZIZURRAHMAN");
      expect(html).toContain("Calm, Ethical &amp; Dedicated Islamic Guidance");
      expect(html).toContain("Dua &amp; Supplication Guidance");
      expect(html).toContain("Family Guidance &amp; Counsel");
      expect(html).toContain("Confidential &amp; Dignified");
      expect(html).toContain('href="/book"');
      expect(html).toContain('href="/services"');
    });

    it("handles empty service catalogue gracefully", async () => {
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce([]);
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(null);

      const page = await HomePage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Service catalogue is currently being prepared");
    });
  });

  describe("About Page", () => {
    it("renders respectful biography and transparency verification note", async () => {
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(mockSiteSettings);

      const page = await AboutPage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("About AZIZURRAHMAN");
      expect(html).toContain("Official Profile Verification");
      expect(html).toContain("No False Guarantees");
      expect(html).toContain("Dignity &amp; Compassion");
      expect(html).toContain('href="/book"');
    });
  });

  describe("Services Page", () => {
    it("renders active service cards with links to details", async () => {
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce(mockServices);
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(mockSiteSettings);

      const page = await ServicesPage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Our Spiritual Services");
      expect(html).toContain("Dua &amp; Supplication Guidance");
      expect(html).toContain('href="/services/dua-and-supplication"');
      expect(html).toContain("Family Guidance &amp; Counsel");
      expect(html).toContain('href="/services/family-consultation"');
    });

    it("renders empty state when no services are active", async () => {
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce([]);
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(null);

      const page = await ServicesPage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("No services currently listed");
      expect(html).toContain("Contact Us");
    });
  });

  describe("Service Detail Page", () => {
    it("renders service details for valid slug", async () => {
      vi.spyOn(publicServices, "getActiveServiceBySlug").mockResolvedValueOnce(mockServices[0]!);
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(mockSiteSettings);

      const page = await ServiceDetailPage({
        params: Promise.resolve({ slug: "dua-and-supplication" }),
      });
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Dua &amp; Supplication Guidance");
      expect(html).toContain("30 minutes");
      expect(html).toContain('href="/book?service=dua-and-supplication"');
      expect(html).toContain("What to Expect from this Session");
      expect(html).toContain("Back to all services");
    });
  });

  describe("Book Appointment Entry Page", () => {
    it("renders 4-step workflow, calendar engine development alert, and active services", async () => {
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce(mockServices);
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(mockSiteSettings);

      const page = await BookAppointmentPage({});
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Request a Consultation");
      expect(html).toContain("Select Service");
      expect(html).toContain("Pick Date &amp; Time");
      expect(html).toContain("Provide Contact Info");
      expect(html).toContain("Slot Confirmation");
      expect(html).toContain("Automated Calendar Engine in Active Development");
      expect(html).toContain('href="/contact"');
    });

    it("renders preselected service banner when query param is present", async () => {
      const callout = await SelectedServiceCallout({
        searchParams: Promise.resolve({ service: "family-consultation" }),
        services: mockServices,
      });
      const html = renderToStaticMarkup(callout);

      expect(html).toContain("Selected Consultation Service");
      expect(html).toContain("Family Guidance &amp; Counsel");
    });
  });

  describe("Contact Page", () => {
    it("renders verified contact channels, hours, and inquiry form", async () => {
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(mockSiteSettings);
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce(mockServices);

      const page = await ContactPage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Get in Touch");
      expect(html).toContain("Official Contact Channels");
      expect(html).toContain("https://wa.me/919876543210");
      expect(html).toContain("tel:+919876543210");
      expect(html).toContain("mailto:guidance@example.com");
      expect(html).toContain("Monday to Saturday, 10:00 AM – 7:00 PM");
      expect(html).toContain("Prepare Your Inquiry Message");
    });

    it("renders pending notice when contact settings are unpopulated", async () => {
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(null);
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce([]);

      const page = await ContactPage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Direct contact channels");
      expect(html).toContain("pending verification");
    });
  });

  describe("Appointment Lookup Page", () => {
    it("renders reference code form shell with privacy assurance and without leaking private records", async () => {
      const page = AppointmentLookupPage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Appointment Lookup");
      expect(html).toContain("Appointment Reference Code");
      expect(html).toContain("Phone Number or Email Address");
      expect(html).toContain("Two-Step Verification Protocol");
      expect(html).toContain("Privacy Guarantee");
      expect(html).not.toContain("customer_name");
      expect(html).not.toContain("private_admin_notes");
    });
  });

  describe("Feedback States", () => {
    it("PublicLoading renders skeleton loader with status role", () => {
      const html = renderToStaticMarkup(<PublicLoading />);
      expect(html).toContain('role="status"');
      expect(html).toContain("Loading page content");
    });

    it("PublicError renders branded error with retry option", () => {
      const html = renderToStaticMarkup(
        <PublicError error={new Error("Test Error")} retry={() => {}} />,
      );
      expect(html).toContain("We encountered an issue loading this page");
      expect(html).toContain("Try Again");
      expect(html).toContain("Return Home");
    });

    it("NotFound renders 404 page with return links", () => {
      const html = renderToStaticMarkup(<NotFound />);
      expect(html).toContain("Error 404");
      expect(html).toContain("Page Not Found");
      expect(html).toContain('href="/"');
      expect(html).toContain('href="/services"');
      expect(html).toContain('href="/contact"');
    });
  });
});
