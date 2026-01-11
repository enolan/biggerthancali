import countriesData from "./data/countries.json";

export interface MetricWithSource {
  value: number;
  year?: number;
  source: string;
  url: string;
}

export interface CountryData {
  name: string;
  code: string;
  population: MetricWithSource;
  gdp: MetricWithSource;
  gdpPerCapita: MetricWithSource;
  area: MetricWithSource;
}

interface DataFile {
  generated: string;
  california: CountryData;
  countries: CountryData[];
}

const data = countriesData as DataFile;

export const CALIFORNIA: CountryData = data.california;

const countries: CountryData[] = data.countries;

// Create a lookup map with lowercase keys for case-insensitive matching
const countryMap = new Map<string, CountryData>();
for (const country of countries) {
  countryMap.set(country.name.toLowerCase(), country);
}

// Add common aliases
const addAlias = (alias: string, canonical: string) => {
  const country = countryMap.get(canonical.toLowerCase());
  if (country) {
    countryMap.set(alias.toLowerCase(), country);
  }
};

// USA aliases
addAlias("us", "united states");
addAlias("usa", "united states");
addAlias("america", "united states");
addAlias("united states of america", "united states");

// UK aliases
addAlias("uk", "united kingdom");
addAlias("britain", "united kingdom");
addAlias("great britain", "united kingdom");
addAlias("england", "united kingdom");

// Korea aliases
addAlias("south korea", "korea, rep.");
addAlias("korea", "korea, rep.");

// Netherlands aliases
addAlias("the netherlands", "netherlands");
addAlias("holland", "netherlands");

// Other common aliases
addAlias("ivory coast", "cote d'ivoire");
addAlias("burma", "myanmar");
addAlias("east timor", "timor-leste");
addAlias("cape verde", "cabo verde");
addAlias("swaziland", "eswatini");
addAlias("democratic republic of the congo", "congo, dem. rep.");
addAlias("drc", "congo, dem. rep.");
addAlias("dr congo", "congo, dem. rep.");
addAlias("congo-kinshasa", "congo, dem. rep.");
addAlias("republic of the congo", "congo, rep.");
addAlias("congo", "congo, rep.");
addAlias("congo-brazzaville", "congo, rep.");
addAlias("russia", "russian federation");
addAlias("vietnam", "viet nam");
addAlias("iran", "iran, islamic rep.");
addAlias("syria", "syrian arab republic");
addAlias("venezuela", "venezuela, rb");
addAlias("egypt", "egypt, arab rep.");
addAlias("laos", "lao pdr");
addAlias("slovakia", "slovak republic");
addAlias("czechia", "czech republic");
addAlias("turkey", "turkiye");
addAlias("uae", "united arab emirates");
addAlias("hong kong", "hong kong sar, china");
addAlias("gambia", "gambia, the");
addAlias("bahamas", "bahamas, the");
addAlias("kyrgyzstan", "kyrgyz republic");
addAlias("saint lucia", "st. lucia");
addAlias("saint kitts and nevis", "st. kitts and nevis");
addAlias("saint vincent and the grenadines", "st. vincent and the grenadines");
addAlias("micronesia", "micronesia, fed. sts.");

export function lookupCountry(name: string): CountryData | undefined {
  return countryMap.get(name.toLowerCase().trim());
}

export function getAllCountries(): CountryData[] {
  return countries;
}

export function getFlagUrl(code: string, size: number = 24): string {
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
}

// Map official World Bank names to common display names
const displayNames: Record<string, string> = {
  "Hong Kong SAR, China": "Hong Kong",
  "Viet Nam": "Vietnam",
  "Korea, Rep.": "South Korea",
  "Korea, Dem. People's Rep.": "North Korea",
  "Iran, Islamic Rep.": "Iran",
  "Egypt, Arab Rep.": "Egypt",
  "Yemen, Rep.": "Yemen",
  "Syrian Arab Republic": "Syria",
  "Venezuela, RB": "Venezuela",
  "Russian Federation": "Russia",
  "Czech Republic": "Czechia",
  "Slovak Republic": "Slovakia",
  "Lao PDR": "Laos",
  "Kyrgyz Republic": "Kyrgyzstan",
  "Turkiye": "Turkey",
  "Gambia, The": "Gambia",
  "Bahamas, The": "Bahamas",
  "Congo, Rep.": "Congo",
  "Congo, Dem. Rep.": "DR Congo",
  "Micronesia, Fed. Sts.": "Micronesia",
  "St. Lucia": "Saint Lucia",
  "St. Kitts and Nevis": "Saint Kitts and Nevis",
  "St. Vincent and the Grenadines": "Saint Vincent and the Grenadines",
};

export function getDisplayName(officialName: string): string {
  return displayNames[officialName] || officialName;
}

export function getDataGenerated(): string {
  return data.generated;
}
