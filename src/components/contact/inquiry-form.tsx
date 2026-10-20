"use client";

import { useState } from "react";

import { buildWhatsAppUrl } from "@/components/contact/contact-actions";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, MailIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface InquiryFormProps {
  whatsapp?: string | null;
  email?: string | null;
  serviceNames?: readonly string[];
}

export function InquiryForm({ whatsapp, email, serviceNames = [] }: InquiryFormProps) {
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");

  const formattedMessage = [
    "Assalamu Alaikum,",
    name.trim() ? `My name is ${name.trim()}.` : "",
    service.trim() ? `Inquiry regarding: ${service.trim()}.` : "",
    message.trim() ? `Message: ${message.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const waUrl = whatsapp ? buildWhatsAppUrl(whatsapp, formattedMessage) : null;
  const mailtoUrl = email
    ? `mailto:${email}?subject=${encodeURIComponent(
        `Consultation Inquiry${service ? ` - ${service}` : ""}`,
      )}&body=${encodeURIComponent(formattedMessage)}`
    : null;

  return (
    <div className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <div>
        <h3 className="font-display text-2xl font-semibold text-primary">
          Prepare Your Inquiry Message
        </h3>
        <p className="mt-1 text-sm text-muted">
          Draft your message here to send directly to {whatsapp ? "WhatsApp" : "our team"}.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          id="inquiry-name"
          label="Your Name (Optional)"
          placeholder="e.g. Muhammad"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {serviceNames.length > 0 && (
          <Select
            id="inquiry-service"
            label="Consultation Topic (Optional)"
            placeholderOption="Select a topic or service..."
            value={service}
            onChange={(e) => setService(e.target.value)}
            options={serviceNames.map((name) => ({ value: name, label: name }))}
          />
        )}

        <Textarea
          id="inquiry-message"
          label="Message or Question"
          placeholder="Briefly describe what you would like guidance on..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="space-y-3 pt-2">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-emerald px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-emerald/90 focus-visible:outline-3 focus-visible:outline-focus"
          >
            <WhatsAppIcon className="size-5 shrink-0" />
            <span>Open in WhatsApp</span>
            <ExternalLinkIcon className="ml-1 size-4 opacity-75" />
          </a>
        )}

        {mailtoUrl && (
          <a
            href={mailtoUrl}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-5 py-2.5 text-base font-medium text-primary transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
          >
            <MailIcon className="size-5 shrink-0" />
            <span>Open in Email</span>
          </a>
        )}

        {!waUrl && !mailtoUrl && (
          <Button variant="primary" size="md" disabled className="w-full">
            Direct channels pending verification
          </Button>
        )}

        <p className="text-center text-xs leading-relaxed text-muted">
          Activating this link opens your messaging app with your text pre-filled. You can review
          and edit it before sending.
        </p>
      </div>
    </div>
  );
}
