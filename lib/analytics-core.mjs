const publicPaths = new Set(["/", "/explore", "/plan", "/cruises", "/install", "/feedback"]);

/** Keep private routes, search filters, URL tokens and fragments out of analytics.
 * @param {string} value
 * @returns {string|null}
 */
export function publicAnalyticsUrl(value) {
  try {
    const url = new URL(value);
    if (url.origin !== "https://duty-perks-angs.vercel.app" || !publicPaths.has(url.pathname)) return null;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch { return null; }
}
