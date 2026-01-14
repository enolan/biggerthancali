import { lookupCountry } from "./data";
import { renderComparison, renderHome, render404, SiteMode } from "./template";

// 32x32 PNG favicon (thinking California bear)
const FAVICON_BASE64 = "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";

function getSiteMode(hostname: string): SiteMode {
  if (hostname.includes("smallerthancali")) {
    return "smaller";
  }
  return "bigger"; // Default for biggerthancali.* and localhost
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = decodeURIComponent(url.pathname);
    const siteMode = getSiteMode(url.hostname);

    // Home page
    if (path === "/" || path === "") {
      return new Response(renderHome(siteMode), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Favicon
    if (path === "/favicon.ico" || path === "/favicon.png") {
      const faviconData = Uint8Array.from(atob(FAVICON_BASE64), c => c.charCodeAt(0));
      return new Response(faviconData, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Country comparison page
    const countryName = path.slice(1); // Remove leading slash
    const country = lookupCountry(countryName);

    if (country) {
      return new Response(renderComparison(country, siteMode), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 404 - country not found
    return new Response(render404(countryName), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};
