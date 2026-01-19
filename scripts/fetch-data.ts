/**
 * Fetches country data from World Bank API and generates countries.json
 * Also fetches California data from Census Bureau and BEA APIs
 * Land area data comes from CIA World Factbook (via factbook.json)
 * Run with: bun run scripts/fetch-data.ts
 */

const WORLD_BANK_BASE = "https://api.worldbank.org/v2";
const CIA_FACTBOOK_BASE = "https://raw.githubusercontent.com/factbook/factbook.json/master";

// World Bank indicator codes (area now comes from CIA World Factbook)
const INDICATORS = {
  population: "SP.POP.TOTL",
  gdp: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
} as const;

// Mapping from ISO2 codes to CIA World Factbook GEC codes and region folders
// GEC (formerly FIPS) codes are used by the CIA World Factbook
// Source: https://www.worlddata.info/countrycodes.php
const ISO2_TO_CIA_FACTBOOK: Record<string, { gec: string; region: string }> = {
  AF: { gec: "af", region: "south-asia" }, // Afghanistan
  AL: { gec: "al", region: "europe" }, // Albania
  DZ: { gec: "ag", region: "africa" }, // Algeria
  AD: { gec: "an", region: "europe" }, // Andorra
  AO: { gec: "ao", region: "africa" }, // Angola
  AG: { gec: "ac", region: "central-america-n-caribbean" }, // Antigua and Barbuda
  AR: { gec: "ar", region: "south-america" }, // Argentina
  AM: { gec: "am", region: "middle-east" }, // Armenia
  AU: { gec: "as", region: "australia-oceania" }, // Australia
  AT: { gec: "au", region: "europe" }, // Austria
  AZ: { gec: "aj", region: "middle-east" }, // Azerbaijan
  BS: { gec: "bf", region: "central-america-n-caribbean" }, // Bahamas
  BH: { gec: "ba", region: "middle-east" }, // Bahrain
  BD: { gec: "bg", region: "south-asia" }, // Bangladesh
  BB: { gec: "bb", region: "central-america-n-caribbean" }, // Barbados
  BY: { gec: "bo", region: "europe" }, // Belarus
  BE: { gec: "be", region: "europe" }, // Belgium
  BZ: { gec: "bh", region: "central-america-n-caribbean" }, // Belize
  BJ: { gec: "bn", region: "africa" }, // Benin
  BT: { gec: "bt", region: "south-asia" }, // Bhutan
  BO: { gec: "bl", region: "south-america" }, // Bolivia
  BA: { gec: "bk", region: "europe" }, // Bosnia and Herzegovina
  BW: { gec: "bc", region: "africa" }, // Botswana
  BR: { gec: "br", region: "south-america" }, // Brazil
  BN: { gec: "bx", region: "east-n-southeast-asia" }, // Brunei
  BG: { gec: "bu", region: "europe" }, // Bulgaria
  BF: { gec: "uv", region: "africa" }, // Burkina Faso
  BI: { gec: "by", region: "africa" }, // Burundi
  CV: { gec: "cv", region: "africa" }, // Cabo Verde
  KH: { gec: "cb", region: "east-n-southeast-asia" }, // Cambodia
  CM: { gec: "cm", region: "africa" }, // Cameroon
  CA: { gec: "ca", region: "north-america" }, // Canada
  CF: { gec: "ct", region: "africa" }, // Central African Republic
  TD: { gec: "cd", region: "africa" }, // Chad
  CL: { gec: "ci", region: "south-america" }, // Chile
  CN: { gec: "ch", region: "east-n-southeast-asia" }, // China
  CO: { gec: "co", region: "south-america" }, // Colombia
  KM: { gec: "cn", region: "africa" }, // Comoros
  CG: { gec: "cf", region: "africa" }, // Republic of the Congo
  CD: { gec: "cg", region: "africa" }, // Democratic Republic of the Congo
  CR: { gec: "cs", region: "central-america-n-caribbean" }, // Costa Rica
  CI: { gec: "iv", region: "africa" }, // Côte d'Ivoire (Ivory Coast)
  HR: { gec: "hr", region: "europe" }, // Croatia
  CU: { gec: "cu", region: "central-america-n-caribbean" }, // Cuba
  CY: { gec: "cy", region: "europe" }, // Cyprus
  CZ: { gec: "ez", region: "europe" }, // Czechia
  DK: { gec: "da", region: "europe" }, // Denmark
  DJ: { gec: "dj", region: "africa" }, // Djibouti
  DM: { gec: "do", region: "central-america-n-caribbean" }, // Dominica
  DO: { gec: "dr", region: "central-america-n-caribbean" }, // Dominican Republic
  EC: { gec: "ec", region: "south-america" }, // Ecuador
  EG: { gec: "eg", region: "africa" }, // Egypt
  SV: { gec: "es", region: "central-america-n-caribbean" }, // El Salvador
  GQ: { gec: "ek", region: "africa" }, // Equatorial Guinea
  ER: { gec: "er", region: "africa" }, // Eritrea
  EE: { gec: "en", region: "europe" }, // Estonia
  SZ: { gec: "wz", region: "africa" }, // Eswatini
  ET: { gec: "et", region: "africa" }, // Ethiopia
  FJ: { gec: "fj", region: "australia-oceania" }, // Fiji
  FI: { gec: "fi", region: "europe" }, // Finland
  FR: { gec: "fr", region: "europe" }, // France
  GA: { gec: "gb", region: "africa" }, // Gabon
  GM: { gec: "ga", region: "africa" }, // Gambia
  GE: { gec: "gg", region: "middle-east" }, // Georgia
  DE: { gec: "gm", region: "europe" }, // Germany
  GH: { gec: "gh", region: "africa" }, // Ghana
  GL: { gec: "gl", region: "north-america" }, // Greenland
  GR: { gec: "gr", region: "europe" }, // Greece
  GD: { gec: "gj", region: "central-america-n-caribbean" }, // Grenada
  GT: { gec: "gt", region: "central-america-n-caribbean" }, // Guatemala
  GN: { gec: "gv", region: "africa" }, // Guinea
  GW: { gec: "pu", region: "africa" }, // Guinea-Bissau
  GY: { gec: "gy", region: "south-america" }, // Guyana
  HT: { gec: "ha", region: "central-america-n-caribbean" }, // Haiti
  HN: { gec: "ho", region: "central-america-n-caribbean" }, // Honduras
  HU: { gec: "hu", region: "europe" }, // Hungary
  IS: { gec: "ic", region: "europe" }, // Iceland
  IN: { gec: "in", region: "south-asia" }, // India
  ID: { gec: "id", region: "east-n-southeast-asia" }, // Indonesia
  IR: { gec: "ir", region: "middle-east" }, // Iran
  IQ: { gec: "iz", region: "middle-east" }, // Iraq
  IE: { gec: "ei", region: "europe" }, // Ireland
  IL: { gec: "is", region: "middle-east" }, // Israel
  IT: { gec: "it", region: "europe" }, // Italy
  JM: { gec: "jm", region: "central-america-n-caribbean" }, // Jamaica
  JP: { gec: "ja", region: "east-n-southeast-asia" }, // Japan
  JO: { gec: "jo", region: "middle-east" }, // Jordan
  KZ: { gec: "kz", region: "central-asia" }, // Kazakhstan
  KE: { gec: "ke", region: "africa" }, // Kenya
  KI: { gec: "kr", region: "australia-oceania" }, // Kiribati
  KP: { gec: "kn", region: "east-n-southeast-asia" }, // North Korea
  KR: { gec: "ks", region: "east-n-southeast-asia" }, // South Korea
  KW: { gec: "ku", region: "middle-east" }, // Kuwait
  KG: { gec: "kg", region: "central-asia" }, // Kyrgyzstan
  LA: { gec: "la", region: "east-n-southeast-asia" }, // Laos
  LV: { gec: "lg", region: "europe" }, // Latvia
  LB: { gec: "le", region: "middle-east" }, // Lebanon
  LS: { gec: "lt", region: "africa" }, // Lesotho
  LR: { gec: "li", region: "africa" }, // Liberia
  LY: { gec: "ly", region: "africa" }, // Libya
  LI: { gec: "ls", region: "europe" }, // Liechtenstein
  LT: { gec: "lh", region: "europe" }, // Lithuania
  LU: { gec: "lu", region: "europe" }, // Luxembourg
  MG: { gec: "ma", region: "africa" }, // Madagascar
  MW: { gec: "mi", region: "africa" }, // Malawi
  MY: { gec: "my", region: "east-n-southeast-asia" }, // Malaysia
  MV: { gec: "mv", region: "south-asia" }, // Maldives
  ML: { gec: "ml", region: "africa" }, // Mali
  MT: { gec: "mt", region: "europe" }, // Malta
  MH: { gec: "rm", region: "australia-oceania" }, // Marshall Islands
  MR: { gec: "mr", region: "africa" }, // Mauritania
  MU: { gec: "mp", region: "africa" }, // Mauritius
  MX: { gec: "mx", region: "north-america" }, // Mexico
  FM: { gec: "fm", region: "australia-oceania" }, // Micronesia
  MD: { gec: "md", region: "europe" }, // Moldova
  MC: { gec: "mn", region: "europe" }, // Monaco
  MN: { gec: "mg", region: "east-n-southeast-asia" }, // Mongolia
  ME: { gec: "mj", region: "europe" }, // Montenegro
  MA: { gec: "mo", region: "africa" }, // Morocco
  MZ: { gec: "mz", region: "africa" }, // Mozambique
  MM: { gec: "bm", region: "east-n-southeast-asia" }, // Myanmar (Burma)
  NA: { gec: "wa", region: "africa" }, // Namibia
  NR: { gec: "nr", region: "australia-oceania" }, // Nauru
  NP: { gec: "np", region: "south-asia" }, // Nepal
  NL: { gec: "nl", region: "europe" }, // Netherlands
  NZ: { gec: "nz", region: "australia-oceania" }, // New Zealand
  NI: { gec: "nu", region: "central-america-n-caribbean" }, // Nicaragua
  NE: { gec: "ng", region: "africa" }, // Niger
  NG: { gec: "ni", region: "africa" }, // Nigeria
  MK: { gec: "mk", region: "europe" }, // North Macedonia
  NO: { gec: "no", region: "europe" }, // Norway
  OM: { gec: "mu", region: "middle-east" }, // Oman
  PK: { gec: "pk", region: "south-asia" }, // Pakistan
  PW: { gec: "ps", region: "australia-oceania" }, // Palau
  PA: { gec: "pm", region: "central-america-n-caribbean" }, // Panama
  PG: { gec: "pp", region: "east-n-southeast-asia" }, // Papua New Guinea
  PY: { gec: "pa", region: "south-america" }, // Paraguay
  PE: { gec: "pe", region: "south-america" }, // Peru
  PH: { gec: "rp", region: "east-n-southeast-asia" }, // Philippines
  PL: { gec: "pl", region: "europe" }, // Poland
  PT: { gec: "po", region: "europe" }, // Portugal
  QA: { gec: "qa", region: "middle-east" }, // Qatar
  RO: { gec: "ro", region: "europe" }, // Romania
  RU: { gec: "rs", region: "central-asia" }, // Russia
  RW: { gec: "rw", region: "africa" }, // Rwanda
  KN: { gec: "sc", region: "central-america-n-caribbean" }, // Saint Kitts and Nevis
  LC: { gec: "st", region: "central-america-n-caribbean" }, // Saint Lucia
  VC: { gec: "vc", region: "central-america-n-caribbean" }, // Saint Vincent and the Grenadines
  WS: { gec: "ws", region: "australia-oceania" }, // Samoa
  SM: { gec: "sm", region: "europe" }, // San Marino
  ST: { gec: "tp", region: "africa" }, // São Tomé and Príncipe
  SA: { gec: "sa", region: "middle-east" }, // Saudi Arabia
  SN: { gec: "sg", region: "africa" }, // Senegal
  RS: { gec: "ri", region: "europe" }, // Serbia
  SC: { gec: "se", region: "africa" }, // Seychelles
  SL: { gec: "sl", region: "africa" }, // Sierra Leone
  SG: { gec: "sn", region: "east-n-southeast-asia" }, // Singapore
  SK: { gec: "lo", region: "europe" }, // Slovakia
  SI: { gec: "si", region: "europe" }, // Slovenia
  SB: { gec: "bp", region: "australia-oceania" }, // Solomon Islands
  SO: { gec: "so", region: "africa" }, // Somalia
  ZA: { gec: "sf", region: "africa" }, // South Africa
  SS: { gec: "od", region: "africa" }, // South Sudan
  ES: { gec: "sp", region: "europe" }, // Spain
  LK: { gec: "ce", region: "south-asia" }, // Sri Lanka
  SD: { gec: "su", region: "africa" }, // Sudan
  SR: { gec: "ns", region: "south-america" }, // Suriname
  SE: { gec: "sw", region: "europe" }, // Sweden
  CH: { gec: "sz", region: "europe" }, // Switzerland
  SY: { gec: "sy", region: "middle-east" }, // Syria
  TW: { gec: "tw", region: "east-n-southeast-asia" }, // Taiwan
  TJ: { gec: "ti", region: "central-asia" }, // Tajikistan
  TZ: { gec: "tz", region: "africa" }, // Tanzania
  TH: { gec: "th", region: "east-n-southeast-asia" }, // Thailand
  TL: { gec: "tt", region: "east-n-southeast-asia" }, // Timor-Leste
  TG: { gec: "to", region: "africa" }, // Togo
  TO: { gec: "tn", region: "australia-oceania" }, // Tonga
  TT: { gec: "td", region: "central-america-n-caribbean" }, // Trinidad and Tobago
  TN: { gec: "ts", region: "africa" }, // Tunisia
  TR: { gec: "tu", region: "middle-east" }, // Turkey
  TM: { gec: "tx", region: "central-asia" }, // Turkmenistan
  TV: { gec: "tv", region: "australia-oceania" }, // Tuvalu
  UG: { gec: "ug", region: "africa" }, // Uganda
  UA: { gec: "up", region: "europe" }, // Ukraine
  AE: { gec: "ae", region: "middle-east" }, // United Arab Emirates
  GB: { gec: "uk", region: "europe" }, // United Kingdom
  US: { gec: "us", region: "north-america" }, // United States
  UY: { gec: "uy", region: "south-america" }, // Uruguay
  UZ: { gec: "uz", region: "central-asia" }, // Uzbekistan
  VU: { gec: "nh", region: "australia-oceania" }, // Vanuatu
  VE: { gec: "ve", region: "south-america" }, // Venezuela
  VN: { gec: "vm", region: "east-n-southeast-asia" }, // Vietnam
  YE: { gec: "ym", region: "middle-east" }, // Yemen
  ZM: { gec: "za", region: "africa" }, // Zambia
  ZW: { gec: "zi", region: "africa" }, // Zimbabwe
  // Additional territories that may appear in World Bank data
  HK: { gec: "hk", region: "east-n-southeast-asia" }, // Hong Kong
  MO: { gec: "mc", region: "east-n-southeast-asia" }, // Macao
  PS: { gec: "we", region: "middle-east" }, // Palestine (West Bank)
  XK: { gec: "kv", region: "europe" }, // Kosovo
  // Overseas territories and dependencies
  AW: { gec: "aa", region: "central-america-n-caribbean" }, // Aruba
  AS: { gec: "aq", region: "australia-oceania" }, // American Samoa
  BM: { gec: "bd", region: "north-america" }, // Bermuda
  KY: { gec: "cj", region: "central-america-n-caribbean" }, // Cayman Islands
  CW: { gec: "uc", region: "central-america-n-caribbean" }, // Curaçao
  FO: { gec: "fo", region: "europe" }, // Faroe Islands
  PF: { gec: "fp", region: "australia-oceania" }, // French Polynesia
  GI: { gec: "gi", region: "europe" }, // Gibraltar
  GU: { gec: "gq", region: "australia-oceania" }, // Guam
  GG: { gec: "gk", region: "europe" }, // Guernsey
  IM: { gec: "im", region: "europe" }, // Isle of Man
  JE: { gec: "je", region: "europe" }, // Jersey
  NC: { gec: "nc", region: "australia-oceania" }, // New Caledonia
  MP: { gec: "cq", region: "australia-oceania" }, // Northern Mariana Islands
  PR: { gec: "rq", region: "central-america-n-caribbean" }, // Puerto Rico
  MF: { gec: "rn", region: "central-america-n-caribbean" }, // St. Martin (French part)
  SX: { gec: "nn", region: "central-america-n-caribbean" }, // Sint Maarten (Dutch part)
  TC: { gec: "tk", region: "central-america-n-caribbean" }, // Turks and Caicos Islands
  VG: { gec: "vi", region: "central-america-n-caribbean" }, // British Virgin Islands
  VI: { gec: "vq", region: "central-america-n-caribbean" }, // Virgin Islands (U.S.)
};

interface MetricWithSource {
  value: number;
  year?: number;
  source: string;
  url: string;
}

interface CountryData {
  name: string;
  code: string;
  population: MetricWithSource;
  gdp: MetricWithSource | null;
  gdpPerCapita: MetricWithSource | null;
  area: MetricWithSource;
}

interface OutputData {
  generated: string;
  california: CountryData;
  countries: CountryData[];
}

interface WorldBankCountry {
  id: string;
  iso2Code: string;
  name: string;
  region: { value: string };
  incomeLevel: { id: string };
}

interface WorldBankIndicatorValue {
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  indicator: { id: string };
}

function getWorldBankUrl(indicator: string, countryCode: string): string {
  return `https://data.worldbank.org/indicator/${indicator}?locations=${countryCode}`;
}

// Generate CIA World Factbook URL from country name
function getCiaFactbookUrl(countryName: string): string {
  // Convert country name to URL slug (lowercase, spaces to hyphens, remove special chars)
  const slug = countryName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Trim hyphens from start/end
  return `https://www.cia.gov/the-world-factbook/countries/${slug}/`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

// Parse area text from CIA World Factbook (e.g., "348,672 sq km" -> 348672)
function parseAreaText(text: string): number | null {
  // Match numbers with optional commas, followed by "sq km"
  const match = text.match(/([\d,]+(?:\.\d+)?)\s*sq\s*km/i);
  if (!match) return null;
  // Remove commas and parse as number
  return Math.round(parseFloat(match[1].replace(/,/g, "")));
}

// Fetch land area from CIA World Factbook for a single country
async function fetchCiaFactbookArea(
  iso2: string,
  countryName: string
): Promise<{ value: number; url: string } | null> {
  const mapping = ISO2_TO_CIA_FACTBOOK[iso2];
  if (!mapping) {
    return null;
  }

  const url = `${CIA_FACTBOOK_BASE}/${mapping.region}/${mapping.gec}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  CIA Factbook fetch failed for ${iso2}: ${response.status}`);
      return null;
    }

    const data: any = await response.json();

    // Navigate to Geography > Area > land > text
    const geography = data?.Geography;
    if (!geography) {
      console.log(`  No Geography section for ${iso2}`);
      return null;
    }

    const area = geography?.Area;
    if (!area) {
      console.log(`  No Area section for ${iso2}`);
      return null;
    }

    // Try to get land area first, fall back to total if land not available
    const landText = area?.land?.text || area?.["land "]?.text;
    const totalText = area?.total?.text || area?.["total "]?.text;

    const areaText = landText || totalText;
    if (!areaText) {
      console.log(`  No land/total area text for ${iso2}`);
      return null;
    }

    const value = parseAreaText(areaText);
    if (value === null) {
      console.log(`  Could not parse area text for ${iso2}: "${areaText}"`);
      return null;
    }

    // Get the official name from the CIA Factbook data for URL generation
    const officialName = data?.Government?.["Country name"]?.["conventional short form"]?.text || countryName;

    return {
      value,
      url: getCiaFactbookUrl(officialName),
    };
  } catch (e) {
    console.log(`  Error fetching CIA Factbook for ${iso2}: ${e}`);
    return null;
  }
}

// Fetch area data for all countries from CIA World Factbook
async function fetchCiaFactbookAreas(
  countries: Map<string, { name: string; code: string }>
): Promise<Map<string, { value: number; url: string }>> {
  console.log("Fetching land area data from CIA World Factbook...");

  const results = new Map<string, { value: number; url: string }>();
  const entries = Array.from(countries.entries());

  // Process in batches to avoid overwhelming the server
  const batchSize = 10;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const promises = batch.map(async ([iso2, info]) => {
      const result = await fetchCiaFactbookArea(iso2, info.name);
      if (result) {
        results.set(iso2, result);
      }
    });
    await Promise.all(promises);

    // Small delay between batches
    if (i + batchSize < entries.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`Got area data for ${results.size} countries from CIA World Factbook`);
  return results;
}

async function fetchCountries(): Promise<Map<string, { name: string; code: string }>> {
  console.log("Fetching country list...");
  const url = `${WORLD_BANK_BASE}/country?format=json&per_page=300`;
  const data = await fetchJson<[unknown, WorldBankCountry[]]>(url);
  const countries = data[1];

  const countryMap = new Map<string, { name: string; code: string }>();

  for (const country of countries) {
    // Skip aggregates (regions, income levels, etc.) - they have region "Aggregates"
    if (country.region.value === "Aggregates") continue;

    // Use ISO2 code as the key
    countryMap.set(country.iso2Code, {
      name: country.name,
      code: country.iso2Code,
    });
  }

  console.log(`Found ${countryMap.size} countries`);
  return countryMap;
}

async function fetchIndicator(
  indicator: string,
  indicatorName: string
): Promise<Map<string, { value: number; year: number }>> {
  console.log(`Fetching ${indicatorName} data...`);

  // Fetch last 5 years to find most recent data
  const url = `${WORLD_BANK_BASE}/country/all/indicator/${indicator}?format=json&per_page=20000&date=2019:2024`;
  const data = await fetchJson<[{ page: number; pages: number; total: number }, WorldBankIndicatorValue[]]>(url);

  const values = data[1];
  const resultMap = new Map<string, { value: number; year: number }>();

  // Group by country and find most recent non-null value
  const byCountry = new Map<string, WorldBankIndicatorValue[]>();
  for (const item of values) {
    if (item.value === null) continue;
    const code = item.countryiso3code;
    if (!byCountry.has(code)) {
      byCountry.set(code, []);
    }
    byCountry.get(code)!.push(item);
  }

  // For each country, get the most recent value
  for (const [code, items] of byCountry) {
    // Sort by year descending
    items.sort((a, b) => parseInt(b.date) - parseInt(a.date));
    const mostRecent = items[0];
    if (mostRecent && mostRecent.value !== null) {
      // Convert ISO3 to ISO2 - we'll match later by name
      resultMap.set(code, {
        value: mostRecent.value,
        year: parseInt(mostRecent.date),
      });
    }
  }

  console.log(`Got ${indicatorName} data for ${resultMap.size} entries`);
  return resultMap;
}

// Map of ISO2 codes to ISO3 codes for matching
async function fetchIso3Map(): Promise<Map<string, string>> {
  const url = `${WORLD_BANK_BASE}/country?format=json&per_page=300`;
  const data = await fetchJson<[unknown, WorldBankCountry[]]>(url);
  const countries = data[1];

  const map = new Map<string, string>();
  for (const country of countries) {
    map.set(country.iso2Code, country.id); // id is the ISO3 code
  }
  return map;
}

// Fetch California population from Census Bureau Population Estimates CSV
async function fetchCaliforniaPopulation(): Promise<{ value: number; year: number }> {
  console.log("Fetching California population from Census Bureau...");

  // Try the most recent population estimates CSV files
  const years = [2024, 2023, 2022];

  for (const year of years) {
    try {
      // Census Population Estimates Program publishes annual CSV files
      const url = `https://www2.census.gov/programs-surveys/popest/datasets/2020-${year}/state/totals/NST-EST${year}-ALLDATA.csv`;
      const response = await fetch(url);

      if (!response.ok) continue;

      const csv = await response.text();
      const lines = csv.trim().split("\n");
      const header = lines[0].split(",");

      // Find the column index for the most recent population estimate
      const popColName = `POPESTIMATE${year}`;
      const popColIndex = header.indexOf(popColName);
      const nameColIndex = header.indexOf("NAME");

      if (popColIndex === -1 || nameColIndex === -1) continue;

      // Find California row
      for (const line of lines.slice(1)) {
        const cols = line.split(",");
        if (cols[nameColIndex] === "California") {
          const population = parseInt(cols[popColIndex]);
          console.log(`Got California population: ${population.toLocaleString()} (${year})`);
          return { value: population, year };
        }
      }
    } catch {
      continue;
    }
  }

  throw new Error("Could not fetch California population from Census Bureau");
}

// Fetch California GDP from FRED (Federal Reserve Economic Data)
async function fetchCaliforniaGDP(): Promise<{ gdp: number; gdpPerCapita: number; year: number }> {
  console.log("Fetching California GDP from FRED...");

  // FRED series CANGSP = California Nominal Gross State Product (millions of dollars)
  // Available without API key via CSV export
  const url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=CANGSP";

  try {
    const response = await fetch(url);
    if (response.ok) {
      const csv = await response.text();
      const lines = csv.trim().split("\n");

      // Parse CSV - format: observation_date,CANGSP
      // Find most recent non-empty value
      for (let i = lines.length - 1; i >= 1; i--) {
        const [date, value] = lines[i].split(",");
        if (value && value !== "." && !isNaN(parseFloat(value))) {
          const gdpMillions = parseFloat(value);
          const year = parseInt(date.split("-")[0]);
          console.log(`Got California GDP: $${gdpMillions.toLocaleString()}M (${year})`);

          // Calculate GDP per capita (will be updated with fetched population)
          // For now use approximate population, will be corrected when we have actual pop
          const gdpPerCapita = Math.round((gdpMillions * 1_000_000) / 39_000_000);
          console.log(`Calculated California GDP per capita: $${gdpPerCapita.toLocaleString()}`);

          return {
            gdp: Math.round(gdpMillions / 1000), // Convert to billions
            gdpPerCapita,
            year
          };
        }
      }
    }
  } catch (e) {
    console.log("FRED API error:", e);
  }

  throw new Error("Could not fetch California GDP from FRED");
}

async function main() {
  const iso3Map = await fetchIso3Map();
  const countries = await fetchCountries();

  // Fetch World Bank indicators (population, GDP, GDP per capita)
  const populationData = await fetchIndicator(INDICATORS.population, "population");
  const gdpData = await fetchIndicator(INDICATORS.gdp, "GDP");
  const gdpPerCapitaData = await fetchIndicator(INDICATORS.gdpPerCapita, "GDP per capita");

  // Fetch land area data from CIA World Factbook
  const areaData = await fetchCiaFactbookAreas(countries);

  // Build country data
  const countryList: CountryData[] = [];

  for (const [iso2, info] of countries) {
    const iso3 = iso3Map.get(iso2);
    if (!iso3) continue;

    const pop = populationData.get(iso3);
    const gdp = gdpData.get(iso3);
    const gdpPc = gdpPerCapitaData.get(iso3);
    const area = areaData.get(iso2); // Area is now keyed by ISO2

    // Skip countries missing population or area (essential for comparison)
    // GDP data is optional - we'll show "no data" for those
    if (!pop || !area) {
      console.log(`Skipping ${info.name} - missing essential data (pop: ${!!pop}, area: ${!!area})`);
      continue;
    }

    countryList.push({
      name: info.name,
      code: iso2,
      population: {
        value: Math.round(pop.value / 1_000_000 * 10) / 10, // Convert to millions, 1 decimal
        year: pop.year,
        source: "World Bank",
        url: getWorldBankUrl(INDICATORS.population, iso2),
      },
      gdp: gdp ? {
        value: Math.round(gdp.value / 1_000_000_000), // Convert to billions USD
        year: gdp.year,
        source: "World Bank",
        url: getWorldBankUrl(INDICATORS.gdp, iso2),
      } : null,
      gdpPerCapita: gdpPc ? {
        value: Math.round(gdpPc.value), // USD per person
        year: gdpPc.year,
        source: "World Bank",
        url: getWorldBankUrl(INDICATORS.gdpPerCapita, iso2),
      } : null,
      area: {
        value: area.value,
        source: "CIA World Factbook",
        url: area.url,
      },
    });
  }

  // Sort by name
  countryList.sort((a, b) => a.name.localeCompare(b.name));

  // Fetch California data from official sources
  const caPopulation = await fetchCaliforniaPopulation();
  const caGDP = await fetchCaliforniaGDP();

  // Calculate GDP per capita using actual fetched population
  const gdpPerCapita = Math.round((caGDP.gdp * 1_000_000_000) / caPopulation.value);
  console.log(`Calculated GDP per capita with actual population: $${gdpPerCapita.toLocaleString()}`);

  const california: CountryData = {
    name: "California",
    code: "US-CA",
    population: {
      value: Math.round(caPopulation.value / 1_000_000 * 10) / 10, // Convert to millions, 1 decimal
      year: caPopulation.year,
      source: "US Census Bureau",
      url: "https://www.census.gov/quickfacts/CA",
    },
    gdp: {
      value: caGDP.gdp,
      year: caGDP.year,
      source: "FRED (Federal Reserve Economic Data)",
      url: "https://fred.stlouisfed.org/series/CANGSP",
    },
    gdpPerCapita: {
      value: gdpPerCapita,
      year: caGDP.year,
      source: "FRED / Census Bureau (calculated)",
      url: "https://fred.stlouisfed.org/series/CANGSP",
    },
    area: {
      // Land area is static, doesn't need to be fetched
      value: 423970,
      source: "US Census Bureau",
      url: "https://www.census.gov/geographies/reference-files/2010/geo/state-area.html",
    },
  };

  const output: OutputData = {
    generated: new Date().toISOString(),
    california,
    countries: countryList,
  };

  // Write to file
  const outputPath = new URL("../src/data/countries.json", import.meta.url);
  await Bun.write(outputPath, JSON.stringify(output, null, 2));

  console.log(`\nWrote ${countryList.length} countries to src/data/countries.json`);
}

main().catch(console.error);
