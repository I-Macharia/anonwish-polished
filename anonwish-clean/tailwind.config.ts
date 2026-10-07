import type { Config } from "tailwindcss";

const v = (n: string) => `hsl(var(--${n}))`;

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: v("background"), foreground: v("foreground"), card: v("card"),
        muted: v("muted"), "muted-foreground": v("muted-foreground"), border: v("border"),
        primary: v("primary"), "primary-foreground": v("primary-foreground"), ring: v("ring"),
      },
    },
  },
} satisfies Config;
