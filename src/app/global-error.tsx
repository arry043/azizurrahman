"use client";

import { useState } from "react";

/**
 * Last-resort boundary for errors in the root layout. It replaces the whole document, so global
 * styles are unavailable — styles are inlined using the brand palette.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  const [isUr] = useState(() => {
    if (typeof document !== "undefined") {
      return document.cookie.includes("azr_locale=ur");
    }
    return false;
  });

  return (
    <html lang={isUr ? "ur" : "en"} dir={isUr ? "rtl" : "ltr"}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fbf5e8",
          color: "#23302a",
          fontFamily: isUr
            ? "var(--font-urdu, 'Noto Nastaliq Urdu'), system-ui, sans-serif"
            : "system-ui, sans-serif",
          padding: "1rem",
          textAlign: "center",
          direction: isUr ? "rtl" : "ltr",
        }}
      >
        <title>
          {isUr ? "کوئی خرابی پیش آ گئی ہے · عزیز الرحمٰن" : "Something went wrong · AZIZURRAHMAN"}
        </title>
        <main>
          <h1 style={{ color: "#07553d", fontFamily: "Georgia, serif" }}>
            {isUr ? "کوئی خرابی پیش آ گئی ہے" : "Something went wrong"}
          </h1>
          <p>
            {isUr ? "براہ کرم کچھ دیر بعد دوبارہ کوشش فرمائیں۔" : "Please try again in a moment."}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1rem",
              minHeight: "44px",
              padding: "0 1.25rem",
              border: 0,
              borderRadius: "0.75rem",
              background: "#07553d",
              color: "#fbf5e8",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {isUr ? "دوبارہ کوشش کریں" : "Try again"}
          </button>
        </main>
      </body>
    </html>
  );
}
