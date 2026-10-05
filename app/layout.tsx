import React from "react";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import AppSetup from "./components/AppSetup";
import "./globals.css";

export const metadata: Metadata = {
  title: "DutyPerks",
  description: "Find verified military offers in San Diego and Whidbey Island.",
  applicationName: "DutyPerks",
  appleWebApp: {capable:true,title:"DutyPerks",statusBarStyle:"default"},
  icons: {icon:"/app-icon/32?v=1",apple:"/app-icon/180?v=1"},
};
export const viewport: Viewport = {width:"device-width",initialScale:1,themeColor:"#153b45"};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppSetup>
        <a className="skip-link" href="#page-content">Skip to content</a>
        <div className="site-shell">
          <header className="site-header"><Link className="brand" href="/">DutyPerks</Link>
            <nav aria-label="Main navigation"><Link href="/explore">Find offers</Link><Link href="/install">Install app</Link><Link href="/feedback">Give feedback</Link></nav>
          </header>
          <div id="page-content">{children}</div>
          <footer className="site-footer"><p>DutyPerks beta · Confirm eligibility and terms with the provider before booking.</p><Link href="/feedback">Feedback and privacy</Link></footer>
        </div>
        </AppSetup>
      </body>
    </html>
  );
}
