import { ExternalLinkIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";
import { normalizeEmail, normalizePhone } from "@/lib/validation/contact";

export interface ContactActionsProps {
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsappTemplate?: string | null;
  className?: string;
  variant?: "horizontal" | "vertical" | "grid";
}

export function buildWhatsAppUrl(phone: string, template?: string | null): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const digits = normalized.replace(/^\+/, "");
  const defaultText = "Assalamu Alaikum, I would like to inquire regarding a consultation.";
  const text = encodeURIComponent(template?.trim() || defaultText);

  return `https://wa.me/${digits}?text=${text}`;
}

export function ContactActions({
  whatsapp,
  phone,
  email,
  whatsappTemplate,
  className,
  variant = "horizontal",
}: ContactActionsProps) {
  const waUrl = whatsapp ? buildWhatsAppUrl(whatsapp, whatsappTemplate) : null;
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
          Direct contact channels (WhatsApp, phone, and email) are currently being finalized and
          will be published upon verification.
        </p>
        <div className="mt-4">
          <LinkButton href="/book" variant="primary" size="md">
            Request an Appointment Online
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
    <div className={cn(containerLayout, className)}>
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-control border border-emerald/40 bg-emerald/10 px-5 py-2.5 text-base font-medium text-emerald transition-colors hover:bg-emerald/20 focus-visible:outline-3 focus-visible:outline-focus"
        >
          <WhatsAppIcon className="size-5 shrink-0 text-emerald" />
          <span>Message on WhatsApp</span>
          <ExternalLinkIcon className="ml-1 size-3.5 opacity-60" />
        </a>
      )}

      {normalizedPhone && (
        <a
          href={`tel:${normalizedPhone}`}
          className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-control border border-border bg-surface px-5 py-2.5 text-base font-medium text-primary transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
        >
          <PhoneIcon className="size-5 shrink-0 text-primary" />
          <span>Call: {normalizedPhone}</span>
        </a>
      )}

      {normalizedEmail && (
        <a
          href={`mailto:${normalizedEmail}`}
          className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-control border border-border bg-surface px-5 py-2.5 text-base font-medium text-primary transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
        >
          <MailIcon className="size-5 shrink-0 text-primary" />
          <span>Email: {normalizedEmail}</span>
        </a>
      )}
    </div>
  );
}
