"use client";

import { ExternalLinkIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { scholarProfile } from "@/config/scholar-profile";
import { useTranslations } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { normalizeEmail, normalizePhone } from "@/lib/validation/contact";

export interface ContactActionsProps {
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsappTemplate?: string | null;
  showNote?: boolean;
  className?: string;
  variant?: "horizontal" | "vertical" | "grid";
}

/**
 * Constructs an RFC-compliant, URL-encoded WhatsApp direct conversation link.
 * Does not transmit any message automatically; the visitor retains full agency to review and send.
 */
export function buildWhatsAppUrl(
  phone: string,
  template?: string | null,
  isUr = false,
): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const digits = normalized.replace(/^\+/, "");
  const defaultText = isUr
    ? scholarProfile.contact.whatsapp.defaultMessageUr
    : scholarProfile.contact.whatsapp.defaultMessageEn;
  const text = encodeURIComponent(template?.trim() || defaultText);

  return `https://wa.me/${digits}?text=${text}`;
}

export function ContactActions({
  whatsapp,
  phone,
  email,
  whatsappTemplate,
  showNote = true,
  className,
  variant = "horizontal",
}: ContactActionsProps) {
  const { locale } = useTranslations();
  const isUr = locale === "ur";

  const waUrl = whatsapp ? buildWhatsAppUrl(whatsapp, whatsappTemplate, isUr) : null;
  const normalizedPhone = phone ? normalizePhone(phone) : null;
  const normalizedEmail = email ? normalizeEmail(email) : null;

  const hasAnyVerified = Boolean(waUrl || normalizedPhone || normalizedEmail);

  if (!hasAnyVerified) {
    return (
      <div
        className={cn(
          "rounded-card border border-border/70 bg-surface-muted/50 p-6 text-center",
          className,
        )}
      >
        <p className="text-sm text-muted">
          {isUr
            ? "رابطے کے براہ راست ذرائع (واٹس ایپ، فون اور ای میل) فی الوقت توثیق کے مراحل میں ہیں اور تصدیق کے فوراً بعد شائع کر دیے جائیں گے۔"
            : "Direct contact channels (WhatsApp, phone, and email) are currently being finalized and will be published upon verification (pending verification)."}
        </p>
        <div className="mt-4">
          <LinkButton href="/book" variant="primary" size="md">
            {isUr ? "آن لائن وقت حاصل کریں" : "Request an Appointment Online"}
          </LinkButton>
        </div>
      </div>
    );
  }

  const containerLayout =
    variant === "vertical"
      ? "flex flex-col gap-3"
      : variant === "grid"
        ? "grid grid-cols-1 sm:grid-cols-3 gap-4"
        : "flex flex-wrap items-center gap-3";

  return (
    <div className="space-y-3">
      <div className={cn(containerLayout, className)}>
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              isUr
                ? "مولوی عزیز الرحمٰن صاحب کو واٹس ایپ پر پیغام ارسال کریں (نئی ونڈو میں گفتگو کھلے گی)"
                : "Message Maulvi Azizurrahman on WhatsApp (opens conversation in new window; you review and send)"
            }
            className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-control border border-emerald/40 bg-emerald/10 px-5 py-2.5 text-base font-medium text-emerald transition-colors hover:bg-emerald/20 focus-visible:outline-3 focus-visible:outline-focus"
          >
            <WhatsAppIcon className="size-5 shrink-0 text-emerald" />
            <span>{isUr ? "واٹس ایپ پر رابطہ کریں" : "Message on WhatsApp"}</span>
            <ExternalLinkIcon className="ml-1 size-3.5 opacity-60 rtl:rotate-180" />
          </a>
        )}

        {normalizedPhone && (
          <a
            href={`tel:${normalizedPhone}`}
            aria-label={
              isUr
                ? `مولوی عزیز الرحمٰن صاحب کو فون کریں ${normalizedPhone}`
                : `Call Maulvi Azizurrahman at ${normalizedPhone}`
            }
            className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-control border border-border bg-surface px-5 py-2.5 text-base font-medium text-primary transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
          >
            <PhoneIcon className="size-5 shrink-0 text-primary" />
            <span>
              {isUr ? "کال کریں: " : "Call: "}
              <bdi dir="ltr">{normalizedPhone}</bdi>
            </span>
          </a>
        )}

        {normalizedEmail && (
          <a
            href={`mailto:${normalizedEmail}`}
            aria-label={
              isUr ? `ای میل ارسال کریں ${normalizedEmail}` : `Send email to ${normalizedEmail}`
            }
            className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-control border border-border bg-surface px-5 py-2.5 text-base font-medium text-primary transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
          >
            <MailIcon className="size-5 shrink-0 text-primary" />
            <span>
              {isUr ? "ای میل: " : "Email: "}
              <bdi dir="ltr">{normalizedEmail}</bdi>
            </span>
          </a>
        )}
      </div>

      {showNote && waUrl && (
        <p className="text-xs text-muted">
          {isUr
            ? "نوٹ: واٹس ایپ کھولنے پر پہلے سے تیار شدہ پیغام کے ساتھ براہ راست گفتگو شروع ہو جائے گی۔ ارسال کرنے سے قبل پیغام کو جانچنا آپ کی صوابدید ہے۔"
            : "Note: Opening WhatsApp opens a direct conversation with a prepared inquiry. You must review and send the message yourself."}
        </p>
      )}
    </div>
  );
}
