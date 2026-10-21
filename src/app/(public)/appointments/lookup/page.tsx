import type { Metadata } from "next";

import { AppointmentLookupView } from "./lookup-view";

export const metadata: Metadata = {
  title: "Appointment Lookup",
  description:
    "Retrieve the status and details of your consultation request securely with your reference code.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppointmentLookupPage() {
  return <AppointmentLookupView />;
}
