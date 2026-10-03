import React from "react";

export const metadata = {
  title: "MilBenefit Trips",
  description: "Find verified military benefits nearby and build benefit-optimized trips."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{fontFamily:"system-ui",maxWidth:900,margin:"0 auto",padding:24}}>
        {children}
      </body>
    </html>
  );
}
