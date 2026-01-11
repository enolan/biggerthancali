import { CountryData, CALIFORNIA, getAllCountries, getFlagUrl, MetricWithSource, getDisplayName } from "./data";

function formatNumber(n: number, decimals = 1): string {
  if (n >= 1000) {
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatRatio(value: number, california: number): string {
  const ratio = value / california;
  if (ratio >= 1) {
    return `${ratio.toFixed(1)}×`;
  } else {
    return `${(ratio * 100).toFixed(0)}%`;
  }
}

function formatMetricLink(metric: MetricWithSource, formatted: string, title?: string): string {
  const yearStr = metric.year ? ` (${metric.year})` : "";
  const titleAttr = title || `Source: ${metric.source}${yearStr}`;
  return `<a href="${metric.url}" target="_blank" rel="noopener" class="metric-link" title="${titleAttr}">${formatted}</a>`;
}

const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem 1rem;
    background: #fafafa;
    color: #333;
  }
  h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
  .subtitle { color: #666; margin-bottom: 2rem; }
  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  th { background: #f5f5f5; font-weight: 600; }
  td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
  th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
  .ratio { font-weight: 600; color: #2563eb; }
  .footer {
    margin-top: 2rem;
    font-size: 0.875rem;
    color: #666;
  }
  .footer a { color: #2563eb; }
  .home-link { margin-bottom: 1rem; }
  .home-link a { color: #2563eb; text-decoration: none; }
  .home-link a:hover { text-decoration: underline; }
  .flag { vertical-align: middle; margin-right: 0.5rem; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
  th .flag { width: 20px; }
  .metric-link {
    color: inherit;
    text-decoration: none;
    border-bottom: 1px dotted #999;
  }
  .metric-link:hover {
    color: #2563eb;
    border-bottom-color: #2563eb;
  }
  .verdict {
    text-align: center;
    padding: 2rem 1rem;
    margin-bottom: 2rem;
  }
  .verdict-flag {
    width: 80px;
    height: auto;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    margin-bottom: 1rem;
  }
  .verdict-text {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .verdict-text .bigger { color: #16a34a; }
  .verdict-text .smaller { color: #dc2626; }
  .verdict-detail {
    color: #666;
    font-size: 1.1rem;
  }
  .details-header {
    font-size: 1rem;
    color: #666;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

// California flag from Wikimedia (public domain)
const CALIFORNIA_FLAG_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_California.svg/40px-Flag_of_California.svg.png";

function getVerdict(country: CountryData, ca: CountryData): { isBigger: boolean; popRatio: number; summary: string } {
  const popRatio = country.population.value / ca.population.value;
  const isBigger = popRatio >= 1;

  let summary: string;
  if (popRatio >= 2) {
    summary = `${popRatio.toFixed(1)}× the population`;
  } else if (popRatio >= 1) {
    const pct = Math.round((popRatio - 1) * 100);
    summary = pct === 0 ? "about the same population" : `${pct}% more people`;
  } else if (popRatio >= 0.5) {
    const pct = Math.round((1 - popRatio) * 100);
    summary = `${pct}% fewer people`;
  } else {
    summary = `${Math.round(popRatio * 100)}% of the population`;
  }

  return { isBigger, popRatio, summary };
}

export function renderComparison(country: CountryData): string {
  const ca = CALIFORNIA;
  const countryFlag = getFlagUrl(country.code, 80);
  const name = getDisplayName(country.name);
  const verdict = getVerdict(country, ca);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} vs California | Bigger Than Cali</title>
  <meta name="description" content="Compare ${name}'s population, GDP, and area to California">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="home-link"><a href="/">← All Countries</a></div>

  <div class="verdict">
    <img src="${countryFlag}" alt="${name} flag" class="verdict-flag">
    <div class="verdict-text">
      ${name} is <span class="${verdict.isBigger ? 'bigger' : 'smaller'}">${verdict.isBigger ? 'BIGGER' : 'SMALLER'}</span> than California
    </div>
    <div class="verdict-detail">${verdict.summary}</div>
  </div>

  <div class="details-header">Details</div>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th><img src="${getFlagUrl(country.code, 20)}" alt="" class="flag">${name}</th>
        <th><img src="${CALIFORNIA_FLAG_URL}" alt="" class="flag" style="width:20px">California</th>
        <th>Ratio</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Population</td>
        <td>${formatMetricLink(country.population, `${formatNumber(country.population.value)}M`)}</td>
        <td>${formatMetricLink(ca.population, `${formatNumber(ca.population.value)}M`)}</td>
        <td class="ratio">${formatRatio(country.population.value, ca.population.value)}</td>
      </tr>
      <tr>
        <td>GDP</td>
        <td>${formatMetricLink(country.gdp, `$${formatNumber(country.gdp.value)}B`)}</td>
        <td>${formatMetricLink(ca.gdp, `$${formatNumber(ca.gdp.value)}B`)}</td>
        <td class="ratio">${formatRatio(country.gdp.value, ca.gdp.value)}</td>
      </tr>
      <tr>
        <td>GDP per Capita</td>
        <td>${formatMetricLink(country.gdpPerCapita, `$${formatNumber(country.gdpPerCapita.value, 0)}`)}</td>
        <td>${formatMetricLink(ca.gdpPerCapita, `$${formatNumber(ca.gdpPerCapita.value, 0)}`)}</td>
        <td class="ratio">${formatRatio(country.gdpPerCapita.value, ca.gdpPerCapita.value)}</td>
      </tr>
      <tr>
        <td>Land Area</td>
        <td>${formatMetricLink(country.area, `${formatNumber(country.area.value, 0)} km²`)}</td>
        <td>${formatMetricLink(ca.area, `${formatNumber(ca.area.value, 0)} km²`)}</td>
        <td class="ratio">${formatRatio(country.area.value, ca.area.value)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Click any number to view its source. Data from World Bank and US government agencies.</p>
  </div>
</body>
</html>`;
}

export function renderHome(): string {
  const countries = getAllCountries().sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const countryLinks = countries
    .map(
      (c) => {
        const displayName = getDisplayName(c.name);
        return `<li><a href="/${encodeURIComponent(c.name)}"><img src="${getFlagUrl(c.code, 20)}" alt="" class="flag">${displayName}</a></li>`;
      }
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bigger Than Cali | Compare Countries to California</title>
  <meta name="description" content="Compare any country's population, GDP, and land area to California">
  <style>
    ${baseStyles}
    .search-box {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }
    .country-list {
      list-style: none;
      columns: 2;
      column-gap: 2rem;
    }
    @media (max-width: 500px) {
      .country-list { columns: 1; }
    }
    .country-list li {
      padding: 0.25rem 0;
      break-inside: avoid;
    }
    .country-list a {
      color: #2563eb;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }
    .country-list a:hover {
      text-decoration: underline;
    }
    .country-list .flag {
      width: 20px;
      height: auto;
    }
    .hidden { display: none; }
  </style>
</head>
<body>
  <h1>Bigger Than Cali</h1>
  <p class="subtitle">Compare any country to California's population, GDP, and land area</p>

  <input type="text" class="search-box" placeholder="Search for a country..." id="search" autocomplete="off">

  <ul class="country-list" id="countries">
      ${countryLinks}
  </ul>

  <div class="footer">
    <p>Type a country name or click to compare. Data from <a href="https://data.worldbank.org/" target="_blank" rel="noopener">World Bank</a>.</p>
  </div>

  <script>
    const search = document.getElementById('search');
    const items = document.querySelectorAll('.country-list li');

    search.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      items.forEach(item => {
        const name = item.textContent.toLowerCase();
        item.classList.toggle('hidden', !name.includes(query));
      });
    });

    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const visible = [...items].filter(i => !i.classList.contains('hidden'));
        if (visible.length === 1) {
          visible[0].querySelector('a').click();
        } else if (e.target.value) {
          window.location.href = '/' + encodeURIComponent(e.target.value);
        }
      }
    });
  </script>
</body>
</html>`;
}

export function render404(countryName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Country Not Found | Bigger Than Cali</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="home-link"><a href="/">← All Countries</a></div>
  <h1>Country Not Found</h1>
  <p class="subtitle">We couldn't find "${countryName}" in our database.</p>
  <p>Try searching from the <a href="/">home page</a>, or check the spelling.</p>
</body>
</html>`;
}
