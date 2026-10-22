"use client";

/** Last-resort boundary: replaces the whole document, so it must not depend on the app layout or styles. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem", color: "#0f2a20" }}>
        <h1>Something went wrong</h1>
        <p>Please reload the page. If the problem continues, try again in a few minutes.</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: "1rem", padding: "0.75rem 1.25rem", borderRadius: "0.75rem", border: 0, background: "#0b6b4a", color: "#fff", fontSize: "1rem" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
