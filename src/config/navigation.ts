export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export const PUBLIC_NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Book Appointment", href: "/book" },
  { label: "Contact", href: "/contact" },
  { label: "Appointment Lookup", href: "/appointments/lookup" },
] as const;

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
  { label: "Lookup", href: "/appointments/lookup" },
] as const;
