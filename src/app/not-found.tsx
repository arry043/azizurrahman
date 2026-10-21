import type { Metadata } from "next";

import { NotFoundView } from "./not-found-view";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundView />;
}
