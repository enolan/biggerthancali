/**
 * Fetches country data from World Bank API and generates countries.json
 * Also fetches California data from Census Bureau and BEA APIs
 * Run with: bun run scripts/fetch-data.ts
 */

const WORLD_BANK_BASE = "https://api.worldbank.org/v2";

// California FIPS code
const CA_FIPS = "06";

// World Bank indicator codes
const INDICATORS = {
  population: "SP.POP.TOTL",
  gdp: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  area: "AG.LND.TOTL.K2",
} as const;

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
  gdp: MetricWithSource;
  gdpPerCapita: MetricWithSource;
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
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

  // Fetch all indicators
  const populationData = await fetchIndicator(INDICATORS.population, "population");
  const gdpData = await fetchIndicator(INDICATORS.gdp, "GDP");
  const gdpPerCapitaData = await fetchIndicator(INDICATORS.gdpPerCapita, "GDP per capita");
  const areaData = await fetchIndicator(INDICATORS.area, "area");

  // Build country data
  const countryList: CountryData[] = [];

  for (const [iso2, info] of countries) {
    const iso3 = iso3Map.get(iso2);
    if (!iso3) continue;

    const pop = populationData.get(iso3);
    const gdp = gdpData.get(iso3);
    const gdpPc = gdpPerCapitaData.get(iso3);
    const area = areaData.get(iso3);

    // Skip countries missing essential data
    if (!pop || !gdp || !gdpPc || !area) {
      console.log(`Skipping ${info.name} - missing data (pop: ${!!pop}, gdp: ${!!gdp}, gdpPc: ${!!gdpPc}, area: ${!!area})`);
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
      gdp: {
        value: Math.round(gdp.value / 1_000_000_000), // Convert to billions USD
        year: gdp.year,
        source: "World Bank",
        url: getWorldBankUrl(INDICATORS.gdp, iso2),
      },
      gdpPerCapita: {
        value: Math.round(gdpPc.value), // USD per person
        year: gdpPc.year,
        source: "World Bank",
        url: getWorldBankUrl(INDICATORS.gdpPerCapita, iso2),
      },
      area: {
        value: Math.round(area.value),
        year: area.year,
        source: "World Bank",
        url: getWorldBankUrl(INDICATORS.area, iso2),
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
