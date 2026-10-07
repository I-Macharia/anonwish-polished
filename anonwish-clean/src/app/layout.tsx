import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const description =
  "Post a wish, or fulfil someone else's anonymously. Donors are never shown to wishers or the public.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "AnonWish — fulfil a wish, anonymously",
    template: "%s · AnonWish",
  },
  description,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "AnonWish",
    title: "AnonWish — fulfil a wish, anonymously",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "AnonWish — fulfil a wish, anonymously",
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <Footer />
          <Toaster richColors position="top-center" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
