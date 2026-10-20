import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { buildWhatsAppUrl, ContactActions } from "@/components/contact/contact-actions";
import { ServiceCard } from "@/components/services/service-card";
import type { PublicService } from "@/types/domain";

describe("UI primitives & components", () => {
  describe("Button & buttonStyles", () => {
    it("generates correct classes for all variants", () => {
      expect(buttonStyles({ variant: "primary" })).toContain("bg-primary");
      expect(buttonStyles({ variant: "secondary" })).toContain("border-primary");
      expect(buttonStyles({ variant: "outline" })).toContain("border-border");
      expect(buttonStyles({ variant: "ghost" })).toContain("text-primary");
      expect(buttonStyles({ variant: "destructive" })).toContain("bg-error");
    });

    it("generates correct classes for all sizes", () => {
      expect(buttonStyles({ size: "sm" })).toContain("min-h-9");
      expect(buttonStyles({ size: "md" })).toContain("min-h-11");
      expect(buttonStyles({ size: "lg" })).toContain("min-h-12");
    });

    it("renders loading state with disabled attribute and aria-busy", () => {
      const html = renderToStaticMarkup(<Button loading>Submit</Button>);
      expect(html).toContain("disabled");
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("animate-spin");
    });

    it("respects disabled prop", () => {
      const html = renderToStaticMarkup(<Button disabled>Disabled Action</Button>);
      expect(html).toContain("disabled");
    });
  });

  describe("Badge", () => {
    it.each([
      ["neutral", "bg-surface-muted"],
      ["success", "bg-emerald/10"],
      ["warning", "bg-warning/15"],
      ["error", "bg-error/10"],
      ["gold", "bg-accent/15"],
      ["primary", "bg-primary"],
    ] as const)("renders %s badge with appropriate style", (variant, expectedClass) => {
      const html = renderToStaticMarkup(<Badge variant={variant}>Status</Badge>);
      expect(html).toContain(expectedClass);
    });
  });

  describe("Card", () => {
    it("renders title and content inside container", () => {
      const html = renderToStaticMarkup(
        <Card variant="default">
          <CardTitle>Card Heading</CardTitle>
          <p>Card Content</p>
        </Card>,
      );
      expect(html).toContain("Card Heading");
      expect(html).toContain("Card Content");
      expect(html).toContain("rounded-card");
    });
  });

  describe("Form Controls", () => {
    it("Input associates label with id and handles error state", () => {
      const html = renderToStaticMarkup(
        <Input
          id="test-input"
          label="Your Name"
          error="Name is required"
          hint="Enter your full name"
          required
        />,
      );
      expect(html).toContain('for="test-input"');
      expect(html).toContain('id="test-input"');
      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain('aria-describedby="test-input-hint test-input-error"');
      expect(html).toContain('role="alert"');
      expect(html).toContain("Name is required");
    });

    it("Textarea associates label and renders error", () => {
      const html = renderToStaticMarkup(
        <Textarea id="test-textarea" label="Message" error="Too long" />,
      );
      expect(html).toContain('for="test-textarea"');
      expect(html).toContain('id="test-textarea"');
      expect(html).toContain("Too long");
    });

    it("Select renders options and associates label", () => {
      const options = [
        { value: "a", label: "Option A" },
        { value: "b", label: "Option B" },
      ];
      const html = renderToStaticMarkup(
        <Select id="test-select" label="Choose" options={options} />,
      );
      expect(html).toContain('for="test-select"');
      expect(html).toContain('id="test-select"');
      expect(html).toContain('value="a"');
      expect(html).toContain("Option A");
    });

    it("Checkbox renders with label and description", () => {
      const html = renderToStaticMarkup(
        <Checkbox id="terms" label="I agree" description="By ticking, you confirm agreement." />,
      );
      expect(html).toContain('for="terms"');
      expect(html).toContain('id="terms"');
      expect(html).toContain("I agree");
      expect(html).toContain("By ticking, you confirm agreement.");
    });
  });

  describe("Alert", () => {
    it("renders role='alert' for error and warning", () => {
      const errorHtml = renderToStaticMarkup(
        <Alert variant="error" title="Error Title">
          Problem
        </Alert>,
      );
      expect(errorHtml).toContain('role="alert"');
      expect(errorHtml).toContain("Error Title");

      const warnHtml = renderToStaticMarkup(<Alert variant="warning">Warning Notice</Alert>);
      expect(warnHtml).toContain('role="alert"');
    });

    it("renders role='status' for info and success", () => {
      const infoHtml = renderToStaticMarkup(<Alert variant="info">Info note</Alert>);
      expect(infoHtml).toContain('role="status"');

      const successHtml = renderToStaticMarkup(<Alert variant="success">Saved</Alert>);
      expect(successHtml).toContain('role="status"');
    });
  });

  describe("MobileNavigation", () => {
    it("renders mobile hamburger button with accessible labels", () => {
      const html = renderToStaticMarkup(<MobileNavigation />);
      expect(html).toContain('aria-label="Open navigation menu"');
      expect(html).toContain('aria-controls="mobile-navigation-drawer"');
      expect(html).toContain('aria-expanded="false"');
    });
  });

  describe("Breadcrumbs", () => {
    it("renders semantic navigation with current page", () => {
      const items = [{ label: "Services", href: "/services" }, { label: "Dua & Wazifa" }];
      const html = renderToStaticMarkup(<Breadcrumbs items={items} />);
      expect(html).toContain('aria-label="Breadcrumb"');
      expect(html).toContain('href="/"');
      expect(html).toContain('href="/services"');
      expect(html).toContain('aria-current="page"');
      expect(html).toContain("Dua &amp; Wazifa");
    });
  });

  describe("Contact actions & WhatsApp URL builder", () => {
    it("builds valid wa.me URL with normalized international phone number", () => {
      const url = buildWhatsAppUrl("+91 98765 43210", "Hello from test");
      expect(url).toBe("https://wa.me/919876543210?text=Hello%20from%20test");
    });

    it("returns null for invalid phone numbers", () => {
      expect(buildWhatsAppUrl("invalid-phone")).toBeNull();
      expect(buildWhatsAppUrl("")).toBeNull();
    });

    it("renders contact action links when verified values exist", () => {
      const html = renderToStaticMarkup(
        <ContactActions
          whatsapp="+91 98765 43210"
          phone="+91 98765 43210"
          email="contact@example.com"
        />,
      );
      expect(html).toContain("https://wa.me/919876543210");
      expect(html).toContain("tel:+919876543210");
      expect(html).toContain("mailto:contact@example.com");
    });

    it("renders pending fallback when no verified contact details are provided", () => {
      const html = renderToStaticMarkup(<ContactActions />);
      expect(html).toContain("Direct contact channels");
      expect(html).toContain("finalized and will be published upon verification");
    });
  });

  describe("ServiceCard", () => {
    const sampleService: PublicService = {
      id: "00000000-0000-4000-8000-000000000101",
      slug: "spiritual-consultation",
      name: "Spiritual Consultation",
      short_description: "Individual guidance in accordance with Islamic ethics.",
      description: "Full description of spiritual guidance.",
      image_url: null,
      duration_minutes: 45,
    };

    it("renders service details and links", () => {
      const html = renderToStaticMarkup(<ServiceCard service={sampleService} />);
      expect(html).toContain("Spiritual Consultation");
      expect(html).toContain("Individual guidance in accordance with Islamic ethics.");
      expect(html).toContain("45 mins");
      expect(html).toContain('href="/services/spiritual-consultation"');
      expect(html).toContain('href="/book?service=spiritual-consultation"');
    });
  });
});
