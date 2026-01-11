import { lookupCountry } from "./data";
import { renderComparison, renderHome, render404, SiteMode } from "./template";

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

    // Favicon - return empty
    if (path === "/favicon.ico") {
      return new Response(null, { status: 204 });
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
