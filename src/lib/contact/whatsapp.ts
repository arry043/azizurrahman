import { scholarProfile } from "@/config/scholar-profile";
import { normalizePhone } from "@/lib/validation/contact";

/**
 * Constructs an RFC-compliant, URL-encoded WhatsApp direct conversation link.
 * Does not transmit any message automatically; the visitor retains full agency to review and send.
 * Pure function: Safe to call from Server Components and Client Components.
 */
export function buildWhatsAppUrl(
  phone: string,
  template?: string | null,
  isUr = false,
): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const digits = normalized.replace(/^\+/, "");
  // Approved starter message contains both English and Urdu (bilingual)
  const defaultText =
    isUr && scholarProfile.contact.whatsapp.bilingualMessage
      ? scholarProfile.contact.whatsapp.bilingualMessage
      : scholarProfile.contact.whatsapp.bilingualMessage;
  const text = encodeURIComponent(template?.trim() || defaultText);

  return `https://wa.me/${digits}?text=${text}`;
}
