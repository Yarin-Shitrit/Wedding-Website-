"use client";

import { useEffect } from "react";

// SDK loader is a side-effect on `window`; guard at module scope so React
// strict-mode double-invokes don't append the script twice.
let sdkScriptInjected = false;

// Minimal JSX typing for the custom element so TS strict mode is happy.
// The SDK registers `<snapfinder-finder>` globally; the attribute names below
// match the SDK's observedAttributes contract.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "snapfinder-finder": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          api?: string;
          "event-token"?: string;
          language?: string;
        },
        HTMLElement
      >;
    }
  }
}

export function PhotosClient({
  apiBase,
  eventToken,
  guestFirstName
}: {
  apiBase: string;
  eventToken: string;
  guestFirstName: string;
}) {
  useEffect(() => {
    // Inject the SDK script once per page load. The SDK calls
    // `customElements.define('snapfinder-finder', ...)`; once registered we
    // never need to load it again, even on remount.
    if (
      sdkScriptInjected ||
      (typeof window !== "undefined" &&
        window.customElements &&
        window.customElements.get("snapfinder-finder"))
    ) {
      sdkScriptInjected = true;
      return;
    }
    const s = document.createElement("script");
    s.src = `${apiBase}/sdk/snapfinder.js`;
    s.async = true;
    document.head.appendChild(s);
    sdkScriptInjected = true;
    // No cleanup: removing the <script> element does not unregister the
    // custom element, and re-loading would only re-execute a no-op define().
  }, [apiBase]);

  // Apply CSS variables that the SDK reads for theming. Using `var(--...)`
  // means future palette tweaks in globals.css propagate without code change.
  const themeVars: React.CSSProperties = {
    // Surfaces / typography
    ["--sf-bg" as never]: "var(--paper)",
    ["--sf-fg" as never]: "var(--ink)",
    ["--sf-muted" as never]: "var(--ink-3)",
    ["--sf-surface" as never]: "var(--ivory)",
    ["--sf-border" as never]: "var(--hair-strong)",
    // Action colours
    ["--sf-primary" as never]: "var(--accent)",
    ["--sf-primary-fg" as never]: "var(--ivory)",
    ["--sf-primary-hover" as never]: "var(--accent-deep)",
    // Shape — flat, in keeping with the rest of the site
    ["--sf-radius" as never]: "0px",
    display: "block",
    width: "100%",
    minHeight: 360
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div className="eyebrow">גלריית האירוע</div>
        <h1
          className="display"
          style={{ fontSize: 34, margin: "10px 0 6px" }}
        >
          {`שלום ${guestFirstName} 👋`}
        </h1>
        <div className="ornament">· · ·</div>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--ink-3)",
            margin: "10px auto 0",
            maxWidth: 320
          }}
        >
          העלו סלפי כדי שנמצא עבורכם את כל התמונות שלכם מהאירוע
        </p>
      </div>

      <noscript>
        <div
          style={{
            padding: "16px 18px",
            border: "1px solid var(--hair-strong)",
            background: "var(--ivory)",
            color: "var(--ink-2)",
            textAlign: "center",
            fontSize: 14,
            lineHeight: 1.7
          }}
        >
          לצפייה בתמונות יש להפעיל JavaScript בדפדפן.
        </div>
      </noscript>

      <snapfinder-finder
        api={apiBase}
        event-token={eventToken}
        language="he"
        style={themeVars}
      />
    </div>
  );
}
