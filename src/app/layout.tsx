import type { Metadata, Viewport } from "next";
// Self-hosted variable fonts instead of next/font/google. This is a
// deliberate deployment-robustness change, not a style change — the
// font-face declarations (@fontsource-variable) are byte-identical
// subsets of the same two Google fonts (Fraunces 100-900, Plus Jakarta
// Sans 200-800), just bundled via npm instead of fetched from
// fonts.googleapis.com at build time. next/font/google requires network
// access to Google's servers during every `next build` — normal on most
// CI, but a real, recurring failure point on any restricted-network build
// environment (locked-down corporate CI, some self-hosted runners, this
// project's own sandboxed dev environment), and it makes the production
// build non-reproducible if Google's fonts CDN ever has an outage during
// a deploy. Self-hosting removes that dependency entirely, and as a
// side benefit avoids sending visitors' IPs to Google at page-load time.
import "@fontsource-variable/fraunces/wght.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { siteDescription, siteName, siteTagline } from "@/data/site";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a4f3e",
};

export const metadata: Metadata = {
  title: {
    default: `${siteName} — ${siteTagline}`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  metadataBase: new URL("https://savartourlover.com"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    type: "website",
    images: [
      {
        url: "/images/logo-badge.png",
        width: 800,
        height: 800,
        alt: `${siteName} — আপনার স্বপ্ন উড়তে দিন`,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased overflow-x-clip max-w-[100vw]"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var o=new MutationObserver(function(m){for(var i=0;i<m.length;i++){if(m[i].attributeName==='cz-shortcut-listen'&&document.body){document.body.removeAttribute('cz-shortcut-listen');}}});o.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['cz-shortcut-listen']});}catch(_){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col text-ink overflow-x-clip max-w-[100vw] selection:bg-emerald/20">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-[100vw] overflow-x-clip">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
