"use client";

/**
 * Last-resort boundary for errors in the root layout. It replaces the whole document, so global
 * styles are unavailable — styles are inlined using the brand palette.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fbf5e8",
          color: "#23302a",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
          textAlign: "center",
        }}
      >
        <title>Something went wrong · AZIZURRAHMAN</title>
        <main>
          <h1 style={{ color: "#07553d", fontFamily: "Georgia, serif" }}>Something went wrong</h1>
          <p>Please try again in a moment.</p>
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
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
