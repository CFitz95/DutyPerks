"use client";

import { useEffect, useState } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { publicAnalyticsUrl } from "../../lib/analytics-core.mjs";

export default function PublicAnalytics() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(window.location.hostname === "duty-perks-angs.vercel.app" && navigator.doNotTrack !== "1");
  }, []);

  if (!enabled) return null;
  return <Analytics debug={false} beforeSend={(event: BeforeSendEvent) => {
    const url = publicAnalyticsUrl(event.url);
    return url ? { ...event, url } : null;
  }} />;
}
