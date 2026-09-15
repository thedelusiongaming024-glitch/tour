import type { Metadata } from "next";
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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { siteDescription, siteName, siteTagline } from "@/data/site";

export const metadata: Metadata = {
  title: {
    default: `${siteName} — ${siteTagline}`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  metadataBase: new URL("https://atithi.example.com"),
  openGraph: {
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    type: "website",
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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var o=new MutationObserver(function(m){for(var i=0;i<m.length;i++){if(m[i].attributeName==='cz-shortcut-listen'&&document.body){document.body.removeAttribute('cz-shortcut-listen');}}});o.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['cz-shortcut-listen']});}catch(_){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col text-ink">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
