"use client";

import { useState } from "react";

import { buildWhatsAppUrl } from "@/components/contact/contact-actions";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, MailIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n/client";

export interface InquiryFormProps {
  whatsapp?: string | null;
  email?: string | null;
  serviceNames?: readonly string[];
}

export function InquiryForm({ whatsapp, email, serviceNames = [] }: InquiryFormProps) {
  const { t, locale } = useTranslations();
  const isUr = locale === "ur";

  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");

  const formattedMessage = [
    isUr ? "السلام علیکم،" : "Assalamu Alaikum,",
    name.trim() ? (isUr ? `میرا نام ${name.trim()} ہے۔` : `My name is ${name.trim()}.`) : "",
    service.trim()
      ? isUr
        ? `موضوعِ استفسار: ${service.trim()}۔`
        : `Inquiry regarding: ${service.trim()}.`
      : "",
    message.trim() ? (isUr ? `پیغام: ${message.trim()}` : `Message: ${message.trim()}`) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const waUrl = whatsapp ? buildWhatsAppUrl(whatsapp, formattedMessage, isUr) : null;
  const mailSubject = isUr
    ? `مشاورتی استفسار${service ? ` - ${service}` : ""}`
    : `Consultation Inquiry${service ? ` - ${service}` : ""}`;
  const mailtoUrl = email
    ? `mailto:${email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(
        formattedMessage,
      )}`
    : null;

  return (
    <div className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <div>
        <h3 className="font-display text-2xl font-semibold text-primary">{t.contact.formTitle}</h3>
        <p className="mt-1 text-sm text-muted">{t.contact.formSubtitle}</p>
      </div>

      <div className="space-y-4">
        <Input
          id="inquiry-name"
          label={t.contact.formNameLabel}
          placeholder={t.contact.formNamePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {serviceNames.length > 0 && (
          <Select
            id="inquiry-service"
            label={t.contact.formTopicLabel}
            placeholderOption={t.contact.formTopicPlaceholder}
            value={service}
            onChange={(e) => setService(e.target.value)}
            options={serviceNames.map((name) => ({ value: name, label: name }))}
          />
        )}

        <Textarea
          id="inquiry-message"
          label={t.contact.formMessageLabel}
          placeholder={t.contact.formMessagePlaceholder}
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
            <span>{t.contact.openWhatsApp}</span>
            <ExternalLinkIcon className="ml-1 size-4 opacity-75 rtl:rotate-180" />
          </a>
        )}

        {mailtoUrl && (
          <a
            href={mailtoUrl}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-5 py-2.5 text-base font-medium text-primary transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
          >
            <MailIcon className="size-5 shrink-0" />
            <span>{t.contact.openEmail}</span>
          </a>
        )}

        {!waUrl && !mailtoUrl && (
          <Button variant="primary" size="md" disabled className="w-full">
            {isUr
              ? "رابطے کے براہ راست ذرائع توثیق کے مراحل میں ہیں"
              : "Direct channels pending verification"}
          </Button>
        )}

        <p className="text-center text-xs leading-relaxed text-muted">
          {isUr
            ? "اس لنک پر کلک کرنے سے آپ کی میسجنگ ایپ پہلے سے تیار شدہ پیغام کے ساتھ کھل جائے گی۔ آپ بھیجنے سے پہلے اس میں ترمیم کر سکتے ہیں۔"
            : "Activating this link opens your messaging app with your text pre-filled. You can review and edit it before sending."}
        </p>
      </div>
    </div>
  );
}
