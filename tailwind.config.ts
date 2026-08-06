import type { Config } from "tailwindcss";

/**
 * Semantic names only. `bg-surface` survives a palette change; `bg-green-900`
 * does not, and it is what let the old UI drift into raw utility colors with
 * no decision behind them.
 */
export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-high": "var(--surface-high)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        owe: "var(--owe)",
        danger: "var(--danger)",
      },
      fontFamily: {
        // no webfont: the app is installable and must render offline instantly
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        // fixed rem ramp (~1.15 ratio) — product UI needs spatial predictability
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.06em" }],
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem", { lineHeight: "1.55rem" }],
        lg: ["1.125rem", { lineHeight: "1.5rem" }],
        xl: ["1.375rem", { lineHeight: "1.7rem", letterSpacing: "-0.01em" }],
        // outside the ramp on purpose: 1.75rem against 1rem body is the
        // size contrast that makes a balance readable across a table
        figure: ["1.75rem", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        display: ["2.75rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "display-lg": ["3.75rem", { lineHeight: "1", letterSpacing: "-0.025em" }],
      },
      borderRadius: {
        // cards top out at 16px; anything rounder reads as decoration
        DEFAULT: "0.5rem",
        panel: "0.875rem",
      },
      transitionTimingFunction: {
        out: "var(--ease-out-quint)",
      },
    },
  },
};
