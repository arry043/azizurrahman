import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import AppointmentReceiptPage from "@/app/(public)/appointments/[ref]/page";
import AppointmentLookupPage from "@/app/(public)/appointments/lookup/page";
import BookAppointmentPage from "@/app/(public)/book/page";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import * as lookupService from "@/lib/lookup/lookup-service";
import * as publicServices from "@/lib/services/public-services";
import type { PublicService } from "@/types/domain";
import { read } from "../support/files";

type ReceiptDetail = NonNullable<
  Awaited<ReturnType<typeof lookupService.getPublicReceiptByReference>>
>;

const mockReceipt: ReceiptDetail = {
  public_reference: "AZR-5NF7M-Q1EMB",
  customer_name: "Mohd Arif Ansari",
  appointment_start: "2026-10-24T15:00:00+05:30",
  appointment_end: "2026-10-24T16:30:00+05:30",
  timezone: "Asia/Kolkata",
  status: "pending",
  created_at: "2026-10-20T10:00:00+05:30",
  services: [
    {
      service_name_snapshot: "[DEV SAMPLE] Short consultation",
      duration_minutes_snapshot: 30,
    },
    {
      service_name_snapshot: "[DEV SAMPLE] Standard consultation",
      duration_minutes_snapshot: 60,
    },
  ],
};

const mockServices: PublicService[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    slug: "short-consultation",
    name: "Short Consultation",
    short_description: "Focused prayer and spiritual supplications.",
    description: "Detailed guidance session.",
    image_url: null,
    duration_minutes: 30,
  },
];

describe("Appointment Receipt Print & PDF Export Architecture", () => {
  describe("Print Stylesheet Specifications (src/app/globals.css)", () => {
    const css = read("src/app/globals.css");

    it("declares standard A4 portrait page size with proper margins", () => {
      expect(css).toContain("@media print");
      expect(css).toContain("size: A4 portrait");
      expect(css).toContain("margin: 10mm 12mm");
    });

    it("globally hides header, footer, nav, aside and non-print selectors with display: none !important", () => {
      expect(css).toMatch(
        /header,\s*footer,\s*nav,\s*aside,\s*\.site-header,\s*\.site-footer[^{]*\{\s*display:\s*none !important;/m,
      );
      expect(css).toContain(".receipt-no-print");
      expect(css).toContain("[data-no-print]");
      expect(css).toContain('a[href="#main-content"]');
    });

    it("neutralizes outer layout wrappers to eliminate margins, padding and page splits", () => {
      expect(css).toMatch(
        /main,\s*#main-content,\s*section,\s*article,\s*\.container-page[^{]*\{\s*margin:\s*0 !important;\s*padding:\s*0 !important;/m,
      );
    });

    it("configures .appointment-receipt-print container for single-page A4 document output", () => {
      expect(css).toContain(".appointment-receipt-print");
      expect(css).toContain("page-break-inside: avoid !important");
      expect(css).toContain("break-inside: avoid !important");
      expect(css).toContain("print-color-adjust: exact !important");
      expect(css).toContain("-webkit-print-color-adjust: exact !important");
    });

    it("suppresses link URL expansions in print", () => {
      expect(css).toContain('a[href]::after {\n    content: "" !important;');
    });
  });

  describe("Layout Header & Footer Print Suppression", () => {
    it("PublicHeader has site-header and print:hidden classes", async () => {
      const header = await PublicHeader();
      const html = renderToStaticMarkup(header);
      expect(html).toContain("site-header");
      expect(html).toContain("print:hidden");
    });

    it("PublicFooter has site-footer and print:hidden classes", async () => {
      const footer = await PublicFooter();
      const html = renderToStaticMarkup(footer);
      expect(html).toContain("site-footer");
      expect(html).toContain("print:hidden");
    });
  });

  describe("Dedicated Receipt Page (/appointments/[ref])", () => {
    it("renders .appointment-receipt-print container with official branding and details", async () => {
      vi.spyOn(lookupService, "getPublicReceiptByReference").mockResolvedValueOnce(mockReceipt);

      const page = await AppointmentReceiptPage({
        params: Promise.resolve({ ref: "AZR-5NF7M-Q1EMB" }),
      });
      const html = renderToStaticMarkup(page);

      // Receipt container
      expect(html).toContain("appointment-receipt-print");

      // Brand header & subtitle
      expect(html).toContain("AZIZURRAHMAN");
      expect(html).toContain("Official Spiritual Guidance &amp; Consultation");

      // Reference code isolated with bdi & dir="ltr"
      expect(html).toContain('dir="ltr"');
      expect(html).toContain("<bdi>AZR-5NF7M-Q1EMB</bdi>");

      // Appointment details
      expect(html).toContain("Mohd Arif Ansari");
      expect(html).toContain("Asia/Kolkata");
      expect(html).toContain("[DEV SAMPLE] Short consultation");
      expect(html).toContain("[DEV SAMPLE] Standard consultation");

      // Status indicator
      expect(html).toContain("Request Pending Review");

      // Receipt notice
      expect(html).toContain("Notice: A printed or saved copy of this receipt reflects the state");

      // Screen-only elements are suppressed in print
      expect(html).toContain("receipt-no-print");
      expect(html).toContain("print:hidden");
    });

    it("hides screen-only breadcrumbs header and action buttons in print", async () => {
      vi.spyOn(lookupService, "getPublicReceiptByReference").mockResolvedValueOnce(mockReceipt);

      const page = await AppointmentReceiptPage({
        params: Promise.resolve({ ref: "AZR-5NF7M-Q1EMB" }),
      });
      const html = renderToStaticMarkup(page);

      // Breadcrumbs header section has print:hidden
      expect(html).toMatch(/<section[^>]*class="[^"]*print:hidden[^"]*"[^>]*>/);

      // Action buttons container has receipt-no-print and print:hidden
      expect(html).toMatch(/<div[^>]*class="[^"]*receipt-no-print[^"]*print:hidden[^"]*"[^>]*>/);
    });
  });

  describe("Book Appointment Page (/book) Print Isolation", () => {
    it("marks sibling headers, workflow steps, and interim cards as print:hidden", async () => {
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce(mockServices);
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce(null);

      const page = await BookAppointmentPage({});
      const html = renderToStaticMarkup(page);

      // Inverse header is hidden in print
      expect(html).toContain("border-b border-accent/30 print:hidden");

      // 4-step workflow guidance is hidden in print
      expect(html).toContain("mb-14 print:hidden");

      // Calendar notice and contact options are hidden in print
      expect(html).toContain("mx-auto max-w-3xl space-y-8 print:hidden");
    });
  });

  describe("Lookup Appointment Page (/appointments/lookup) Print Isolation", () => {
    it("marks header and left privacy column as print:hidden", () => {
      const html = renderToStaticMarkup(<AppointmentLookupPage />);

      // Header section has print:hidden
      expect(html).toContain("border-b border-accent/30 print:hidden");

      // Left privacy column has print:hidden
      expect(html).toContain("space-y-6 text-start lg:col-span-6 print:hidden");

      // Right column expands in print
      expect(html).toContain("print:col-span-12 print:w-full");
    });
  });
});
